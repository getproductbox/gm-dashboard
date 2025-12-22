import { supabase } from "@/integrations/supabase/client";

export type CostCategory = 'wages' | 'cogs' | 'security';

export interface CostBenchmark {
  category: CostCategory;
  benchmark_percent: number;
}

export interface CostBenchmarks {
  wages: number;
  cogs: number;
  security: number;
}

export const benchmarkService = {
  /**
   * Fetch all cost benchmarks from the database
   */
  async getBenchmarks(): Promise<CostBenchmarks> {
    // Use 'as any' to bypass TypeScript checking for the new table
    const { data, error } = await (supabase
      .from('cost_benchmarks' as any)
      .select('category, benchmark_percent') as any);

    if (error) {
      throw error;
    }

    // Convert array to object
    const benchmarks: CostBenchmarks = {
      wages: 0,
      cogs: 0,
      security: 0,
    };

    data?.forEach((row: { category: string; benchmark_percent: number }) => {
      if (row.category in benchmarks) {
        benchmarks[row.category as CostCategory] = Number(row.benchmark_percent);
      }
    });

    return benchmarks;
  },

  /**
   * Save cost benchmarks to the database
   */
  async saveBenchmarks(benchmarks: CostBenchmarks): Promise<void> {
    const categories: CostCategory[] = ['wages', 'cogs', 'security'];
    
    // Upsert each benchmark
    for (const category of categories) {
      // Use 'as any' to bypass TypeScript checking for the new table
      const { error } = await (supabase
        .from('cost_benchmarks' as any)
        .update({ 
          benchmark_percent: benchmarks[category],
          updated_at: new Date().toISOString()
        })
        .eq('category', category) as any);

      if (error) {
        throw error;
      }
    }
  },
};

