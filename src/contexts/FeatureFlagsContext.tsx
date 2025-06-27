
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean; // default state for all users
  category: 'ui' | 'pages' | 'experimental';
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  isFeatureEnabled: (key: string) => boolean;
  toggleFeature: (key: string) => void;
  resetToDefaults: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

// Default feature flags that apply to all users
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'newRevenueCharts',
    name: 'New Revenue Charts',
    description: 'Enhanced chart designs on the Revenue page',
    enabled: false,
    category: 'ui'
  },
  {
    key: 'enhancedCustomerView',
    name: 'Enhanced Customer View',
    description: 'Show advanced customer features and analytics',
    enabled: false,
    category: 'ui'
  },
  {
    key: 'betaBookingFlow',
    name: 'Beta Booking Flow',
    description: 'Experimental booking creation workflow',
    enabled: false,
    category: 'experimental'
  },
  {
    key: 'debugMode',
    name: 'Debug Mode',
    description: 'Show additional debug information throughout the app',
    enabled: false,
    category: 'experimental'
  }
];

const STORAGE_KEY = 'featureFlags';

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);

  useEffect(() => {
    // Load user overrides from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userOverrides = JSON.parse(stored);
        const updatedFlags = DEFAULT_FLAGS.map(flag => ({
          ...flag,
          enabled: userOverrides.hasOwnProperty(flag.key) ? userOverrides[flag.key] : flag.enabled
        }));
        setFlags(updatedFlags);
      } catch (error) {
        console.error('Error loading feature flags from localStorage:', error);
      }
    }
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    return flag ? flag.enabled : false;
  };

  const toggleFeature = (key: string) => {
    const defaultFlag = DEFAULT_FLAGS.find(f => f.key === key);
    if (!defaultFlag) return;

    setFlags(prev => {
      const updated = prev.map(flag => 
        flag.key === key ? { ...flag, enabled: !flag.enabled } : flag
      );
      
      // Save user overrides to localStorage
      const userOverrides: Record<string, boolean> = {};
      updated.forEach(flag => {
        const defaultValue = DEFAULT_FLAGS.find(f => f.key === flag.key)?.enabled ?? false;
        if (flag.enabled !== defaultValue) {
          userOverrides[flag.key] = flag.enabled;
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userOverrides));
      return updated;
    });
  };

  const resetToDefaults = () => {
    setFlags(DEFAULT_FLAGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      isFeatureEnabled,
      toggleFeature,
      resetToDefaults
    }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }
  return context;
}
