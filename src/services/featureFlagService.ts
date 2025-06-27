
import { supabase } from '@/integrations/supabase/client';

export interface GlobalFeatureFlagDefault {
  id: string;
  flag_key: string;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export const featureFlagService = {
  async getGlobalDefaults(): Promise<Record<string, boolean>> {
    const { data, error } = await supabase
      .from('feature_flag_defaults')
      .select('flag_key, enabled');

    if (error) {
      console.error('Error fetching global feature flag defaults:', error);
      return {};
    }

    return data.reduce((acc, flag) => {
      acc[flag.flag_key] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);
  },

  async updateGlobalDefault(flagKey: string, enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('feature_flag_defaults')
      .update({ 
        enabled,
        updated_by: (await supabase.auth.getUser()).data.user?.id 
      })
      .eq('flag_key', flagKey);

    if (error) {
      console.error('Error updating global feature flag default:', error);
      return false;
    }

    return true;
  },

  async ensureFlagExists(flagKey: string, defaultEnabled: boolean): Promise<void> {
    const { data } = await supabase
      .from('feature_flag_defaults')
      .select('flag_key')
      .eq('flag_key', flagKey)
      .single();

    if (!data) {
      await supabase
        .from('feature_flag_defaults')
        .insert({ 
          flag_key: flagKey, 
          enabled: defaultEnabled,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        });
    }
  }
};
