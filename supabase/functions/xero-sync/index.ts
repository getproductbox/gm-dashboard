import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: string;
  Class: string;
  Status: string;
  Description?: string;
}

interface XeroProfitLossSection {
  Title: string;
  Rows: Array<{
    RowType: string;
    Cells: Array<{ Value: string; Attributes?: Array<{ Value: string; Id: string }> }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('=== XERO SYNC FUNCTION START ===');
    console.log('Current UTC time:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { syncType = 'full', environment = 'production', test_connection_only = false } = await req.json().catch(() => ({}));
    console.log('Sync parameters:', { syncType, environment, test_connection_only });

    // If this is just a connection test, run a simple API call
    if (test_connection_only) {
      console.log('=== TESTING XERO CONNECTION ===');
      try {
        const testResult = await callXeroAPI(supabase, 'accounts', environment);
        
        if (testResult.success) {
          const result = {
            success: true,
            message: 'Xero connection test successful',
            timestamp: new Date().toISOString()
          };
          
          console.log('✅ CONNECTION TEST PASSED:', result);
          return new Response(JSON.stringify(result, null, 2), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error(testResult.error || 'API call failed');
        }
      } catch (error) {
        console.error('❌ CONNECTION TEST FAILED:', error);
        
        const errorResult = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(errorResult, null, 2), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update sync status to running
    const syncSessionId = crypto.randomUUID();
    await updateSyncStatus(supabase, environment, {
      sync_status: 'running',
      sync_session_id: syncSessionId,
      last_sync_attempt: new Date().toISOString(),
      error_message: null,
      last_heartbeat: new Date().toISOString()
    });

    let accountsProcessed = 0;
    let reportsProcessed = 0;

    // Step 1: Sync Chart of Accounts
    console.log('=== SYNCING CHART OF ACCOUNTS ===');
    try {
      const accountsResult = await callXeroAPI(supabase, 'accounts', environment);
      if (accountsResult.success && accountsResult.data?.Accounts) {
        accountsProcessed = await processAccounts(supabase, accountsResult.data.Accounts);
        console.log(`✅ Processed ${accountsProcessed} accounts`);
      }
    } catch (error) {
      console.error('❌ Error syncing accounts:', error);
      throw new Error(`Account sync failed: ${error.message}`);
    }

    // Step 2: Sync Profit & Loss Report
    console.log('=== SYNCING PROFIT & LOSS REPORT ===');
    try {
      // Get last 12 months of P&L data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const params = {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
        standardLayout: 'true'
      };

      const profitLossResult = await callXeroAPI(supabase, 'profit-and-loss', environment, params);
      if (profitLossResult.success && profitLossResult.data?.Reports?.[0]) {
        reportsProcessed = await processProfitLossReport(supabase, profitLossResult.data.Reports[0], params);
        console.log(`✅ Processed ${reportsProcessed} P&L entries`);
      }
    } catch (error) {
      console.error('❌ Error syncing profit & loss:', error);
      throw new Error(`P&L sync failed: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;

    // Update sync status to completed
    await updateSyncStatus(supabase, environment, {
      sync_status: 'completed',
      last_successful_sync: new Date().toISOString(),
      accounts_synced: accountsProcessed,
      reports_synced: reportsProcessed,
      progress_percentage: 100,
      last_heartbeat: new Date().toISOString()
    });

    const result = {
      success: true,
      message: 'Xero sync completed successfully',
      stats: {
        accounts_processed: accountsProcessed,
        reports_processed: reportsProcessed,
        execution_time_ms: executionTime
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ XERO SYNC COMPLETED:', result);
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ XERO SYNC FAILED:', error);

    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime
    };

    // Update sync status to error
    try {
      const { environment = 'production' } = await req.json().catch(() => ({}));
      await updateSyncStatus(supabase, environment, {
        sync_status: 'error',
        error_message: error.message,
        last_heartbeat: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    return new Response(JSON.stringify(errorResult, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callXeroAPI(supabase: any, endpoint: string, environment: string, params?: Record<string, string>) {
  const response = await supabase.functions.invoke('universal-api-proxy', {
    body: {
      provider: 'xero',
      endpoint,
      environment,
      query_params: params
    }
  });

  if (response.error) {
    throw new Error(`API call failed: ${response.error.message}`);
  }

  return response.data;
}

async function processAccounts(supabase: any, accounts: XeroAccount[]) {
  console.log(`Processing ${accounts.length} accounts...`);
  
  let processed = 0;
  const batchSize = 50;

  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize);
    
    const accountsToInsert = batch.map(account => ({
      xero_account_id: account.AccountID,
      account_code: account.Code,
      account_name: account.Name,
      account_type: account.Type,
      account_class: account.Class,
      is_active: account.Status === 'ACTIVE',
      description: account.Description || null,
      raw_response: account,
      synced_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('xero_accounts')
      .upsert(accountsToInsert, { 
        onConflict: 'xero_account_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error inserting accounts batch:', error);
      throw new Error(`Failed to store accounts: ${error.message}`);
    }

    processed += batch.length;
  }

  return processed;
}

async function processProfitLossReport(supabase: any, report: any, params: any) {
  console.log('Processing Profit & Loss report...');
  
  const reportId = `pl_${params.fromDate}_${params.toDate}`;
  const reportDate = new Date(params.toDate);

  // Store raw report
  const { error: rawError } = await supabase
    .from('xero_profit_loss_raw')
    .upsert({
      report_id: reportId,
      report_date: params.toDate,
      raw_response: report,
      synced_at: new Date().toISOString()
    }, { onConflict: 'report_id,report_date' });

  if (rawError) {
    console.error('Error storing raw P&L report:', rawError);
    throw new Error(`Failed to store raw report: ${rawError.message}`);
  }

  // Process sections into normalized events
  let eventsProcessed = 0;
  const profitLossEvents: any[] = [];

  if (report.Rows) {
    for (const section of report.Rows) {
      if (section.RowType === 'Section' && section.Rows) {
        const category = mapSectionToCategory(section.Title);
        
        for (const row of section.Rows) {
          if (row.RowType === 'Row' && row.Cells && row.Cells.length >= 2) {
            const accountName = row.Cells[0]?.Value;
            const amountStr = row.Cells[row.Cells.length - 1]?.Value;
            
            if (accountName && amountStr && !isNaN(parseFloat(amountStr))) {
              const amountCents = Math.round(parseFloat(amountStr) * 100);
              
              const event = {
                account_id: `xero_${accountName.replace(/\s+/g, '_').toLowerCase()}`,
                account_name: accountName,
                account_type: section.Title,
                category,
                subcategory: mapAccountToSubcategory(accountName, category),
                amount_cents: amountCents,
                currency: 'USD',
                period_start: params.fromDate,
                period_end: params.toDate,
                report_date: params.toDate,
                processed_at: new Date().toISOString()
              };

              profitLossEvents.push(event);
              eventsProcessed++;
            }
          }
        }
      }
    }
  }

  // Store normalized events
  if (profitLossEvents.length > 0) {
    const { error: eventsError } = await supabase
      .from('profit_loss_events')
      .upsert(profitLossEvents, { 
        onConflict: 'account_id,report_date',
        ignoreDuplicates: false 
      });

    if (eventsError) {
      console.error('Error storing P&L events:', eventsError);
      throw new Error(`Failed to store events: ${eventsError.message}`);
    }
  }

  return eventsProcessed;
}

function mapSectionToCategory(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('income') || title.includes('revenue') || title.includes('sales')) {
    return 'revenue';
  } else if (title.includes('cost of sales') || title.includes('cost of goods') || title.includes('cogs')) {
    return 'cost_of_sales';
  } else if (title.includes('expense') || title.includes('operating')) {
    return 'operating_expenses';
  }
  
  return 'other';
}

function mapAccountToSubcategory(accountName: string, category: string): string {
  const name = accountName.toLowerCase();
  
  if (category === 'revenue') {
    if (name.includes('bar') || name.includes('beverage') || name.includes('drink')) {
      return 'bar_revenue';
    } else if (name.includes('door') || name.includes('admission') || name.includes('ticket')) {
      return 'door_revenue';
    } else if (name.includes('food')) {
      return 'food_revenue';
    }
    return 'other_revenue';
  } else if (category === 'operating_expenses') {
    if (name.includes('staff') || name.includes('wage') || name.includes('salary') || name.includes('payroll')) {
      return 'staff_costs';
    } else if (name.includes('rent') || name.includes('lease')) {
      return 'rent';
    } else if (name.includes('marketing') || name.includes('advertising')) {
      return 'marketing';
    } else if (name.includes('utility') || name.includes('electric') || name.includes('gas')) {
      return 'utilities';
    }
    return 'other_expenses';
  }
  
  return 'other';
}

async function updateSyncStatus(supabase: any, environment: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('xero_sync_status')
    .upsert({
      environment: environment,
      updated_at: new Date().toISOString(),
      ...updates
    }, { onConflict: 'environment' });

  if (error) {
    console.error('Error updating sync status:', error);
    throw new Error(`Failed to update sync status: ${error.message}`);
  }
}