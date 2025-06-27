
import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface FeatureGateProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
