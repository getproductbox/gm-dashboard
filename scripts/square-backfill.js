#!/usr/bin/env node

const { Client: SquareClient } = require('squareup');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'production';

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const squareClient = new SquareClient({
  accessToken: squareAccessToken,
  environment: squareEnvironment === 'production' ? 'production' : 'sandbox'
});

// Venue mapping based on location IDs
const VENUE_MAPPING = {
  // You'll need to replace these with your actual Square location IDs
  'LOCATION_ID_MANOR': 'manor',
  'LOCATION_ID_HIPPIE': 'hippie'
};

// Revenue type classification based on payment metadata
function classifyRevenueType(payment) {
  // This logic will need to be customized based on your business rules
  // You might use note field, source application, or other metadata
  
  const note = payment.note?.toLowerCase() || '';
  const appName = payment.source_type?.toLowerCase() || '';
  
  if (note.includes('door') || note.includes('entry') || note.includes('ticket')) {
    return 'door';
  }
  
  if (note.includes('bar') || note.includes('drink') || note.includes('beverage')) {
    return 'bar';
  }
  
  // Default classification - you might want to make this more sophisticated
  return 'other';
}

function getVenueFromLocationId(locationId) {
  return VENUE_MAPPING[locationId] || 'manor'; // Default to manor
}

async function updateBackfillSession(sessionId, updates) {
  const { error } = await supabase
    .from('square_backfill_sessions')
    .update(updates)
    .eq('id', sessionId);
    
  if (error) {
    console.error('Error updating backfill session:', error);
  }
}

async function savePaymentToDatabase(payment, sessionId) {
  try {
    // 1. Save raw payment data
    const { error: rawError } = await supabase
      .from('square_payments_raw')
      .upsert({
        square_payment_id: payment.id,
        raw_response: payment,
        api_version: '2024-06-04', // Update this to match the API version you're using
        sync_timestamp: new Date().toISOString()
      }, {
        onConflict: 'square_payment_id'
      });

    if (rawError) {
      console.error('Error saving raw payment:', rawError);
      return false;
    }

    // 2. Process and save revenue event
    const venue = getVenueFromLocationId(payment.location_id);
    const revenueType = classifyRevenueType(payment);
    const paymentDate = new Date(payment.created_at);
    
    const { error: revenueError } = await supabase
      .from('revenue_events')
      .upsert({
        square_payment_id: payment.id,
        venue: venue,
        revenue_type: revenueType,
        amount_cents: payment.amount_money?.amount || 0,
        currency: payment.amount_money?.currency || 'USD',
        payment_date: paymentDate.toISOString(),
        payment_hour: paymentDate.getHours(),
        payment_day_of_week: paymentDate.getDay(),
        status: payment.status === 'COMPLETED' ? 'completed' : payment.status.toLowerCase()
      }, {
        onConflict: 'square_payment_id'
      });

    if (revenueError) {
      console.error('Error saving revenue event:', revenueError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
}

async function fetchPaymentsInDateRange(startDate, endDate, sessionId) {
  let cursor;
  let totalProcessed = 0;
  let totalFetched = 0;
  const batchSize = 100; // Square API limit
  
  console.log(`Starting backfill from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  try {
    do {
      console.log(`Fetching batch... (processed so far: ${totalFetched})`);
      
      const response = await squareClient.paymentsApi.listPayments({
        beginTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        sortOrder: 'ASC',
        cursor: cursor,
        limit: batchSize
      });

      if (!response.result || !response.result.payments) {
        console.log('No more payments found');
        break;
      }

      const payments = response.result.payments;
      totalFetched += payments.length;
      
      console.log(`Processing ${payments.length} payments...`);
      
      // Process payments in smaller batches to avoid overwhelming the database
      for (let i = 0; i < payments.length; i += 10) {
        const batch = payments.slice(i, i + 10);
        const promises = batch.map(payment => savePaymentToDatabase(payment, sessionId));
        const results = await Promise.all(promises);
        
        const successCount = results.filter(Boolean).length;
        totalProcessed += successCount;
        
        if (successCount < batch.length) {
          console.warn(`Only ${successCount}/${batch.length} payments saved in this batch`);
        }
      }
      
      // Update session progress
      await updateBackfillSession(sessionId, {
        payments_processed: totalProcessed,
        status: 'running'
      });
      
      cursor = response.result.cursor;
      
      // Small delay to be respectful of API limits
      if (cursor) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } while (cursor);
    
    console.log(`Backfill completed. Processed ${totalProcessed}/${totalFetched} payments successfully.`);
    
    return { totalProcessed, totalFetched };
    
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  }
}

async function runBackfill() {
  try {
    // Get the pending backfill session
    const { data: sessions, error: sessionError } = await supabase
      .from('square_backfill_sessions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (sessionError) {
      throw new Error(`Error fetching backfill session: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      console.log('No pending backfill sessions found.');
      
      // Optionally create a new session for a specific date range
      const createNew = process.argv.includes('--create-session');
      if (createNew) {
        const startDate = new Date('2024-01-01T00:00:00Z'); // Adjust as needed
        const endDate = new Date(); // Now
        
        const { data: newSession, error: createError } = await supabase
          .from('square_backfill_sessions')
          .insert({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'pending'
          })
          .select()
          .single();
          
        if (createError) {
          throw new Error(`Error creating backfill session: ${createError.message}`);
        }
        
        console.log('Created new backfill session:', newSession.id);
        sessions.push(newSession);
      } else {
        console.log('Use --create-session flag to create a new backfill session');
        return;
      }
    }

    const session = sessions[0];
    console.log(`Running backfill session: ${session.id}`);
    console.log(`Date range: ${session.start_date} to ${session.end_date}`);

    // Update session status to running
    await updateBackfillSession(session.id, {
      status: 'running',
      error_message: null
    });

    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);
    
    const result = await fetchPaymentsInDateRange(startDate, endDate, session.id);
    
    // Mark session as completed
    await updateBackfillSession(session.id, {
      status: 'completed',
      payments_processed: result.totalProcessed,
      completed_at: new Date().toISOString(),
      error_message: result.totalProcessed < result.totalFetched ? 
        `Some payments failed to process. Processed: ${result.totalProcessed}/${result.totalFetched}` : null
    });
    
    console.log('Backfill session completed successfully!');
    
  } catch (error) {
    console.error('Backfill failed:', error);
    
    // Try to update session status to failed
    try {
      const { data: sessions } = await supabase
        .from('square_backfill_sessions')
        .select('id')
        .eq('status', 'running')
        .limit(1);
        
      if (sessions && sessions.length > 0) {
        await updateBackfillSession(sessions[0].id, {
          status: 'failed',
          error_message: error.message
        });
      }
    } catch (updateError) {
      console.error('Could not update session status:', updateError);
    }
    
    process.exit(1);
  }
}

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

if (!squareAccessToken) {
  console.error('Missing Square access token. Please check your .env.local file.');
  process.exit(1);
}

console.log('Square Backfill Script Starting...');
console.log(`Environment: ${squareEnvironment}`);
console.log(`Supabase URL: ${supabaseUrl}`);

// Run the backfill
runBackfill();
