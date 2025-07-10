import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApiProvider, ApiEndpoint, ApiConfiguration } from '@/types/api';

export const useApiProviders = () => {
  return useQuery({
    queryKey: ['api-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_providers')
        .select(`
          *,
          api_endpoints(*),
          api_configurations(*)
        `)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data as (ApiProvider & {
        api_endpoints: ApiEndpoint[];
        api_configurations: ApiConfiguration[];
      })[];
    },
  });
};

export const useApiProxy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      provider: string;
      endpoint: string;
      environment: 'sandbox' | 'production';
      query_params?: Record<string, string | number>;
      body?: any;
      custom_headers?: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke('universal-api-proxy', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['api-test-results'] });
    },
  });
};