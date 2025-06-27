
import { useFeatureFlagsContext } from '@/contexts/FeatureFlagsContext';

export function useFeatureFlag(key: string): boolean {
  const { isFeatureEnabled } = useFeatureFlagsContext();
  return isFeatureEnabled(key);
}
