
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { featureFlagService } from '@/services/featureFlagService';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean; // current effective state
  category: 'ui' | 'pages' | 'experimental';
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  isFeatureEnabled: (key: string) => boolean;
  toggleFeature: (key: string) => void;
  resetToDefaults: () => void;
  getGlobalDefault: (key: string) => boolean;
  hasUserOverride: (key: string) => boolean;
  resetFlagToDefault: (key: string) => void;
  updateGlobalDefault: (key: string, enabled: boolean) => Promise<boolean>;
  getPersonalValue: (key: string) => boolean;
  hasPersonalOverride: (key: string) => boolean;
  setPersonalOverride: (key: string, enabled: boolean) => void;
  resetPersonalOverride: (key: string) => void;
  isLoading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

// Hardcoded flag definitions with original defaults (fallback values)
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'showCalendar',
    name: 'Calendar Navigation',
    description: 'Show Calendar tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
  {
    key: 'showBookings',
    name: 'Bookings Navigation',
    description: 'Show Bookings tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
  {
    key: 'showCustomers',
    name: 'Customers Navigation',
    description: 'Show Customers tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
  {
    key: 'showRevenue',
    name: 'Revenue Navigation',
    description: 'Show Revenue tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
  {
    key: 'showDeveloperTools',
    name: 'Developer Tools Navigation',
    description: 'Show Developer Tools tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
  {
    key: 'showSettings',
    name: 'Settings Navigation',
    description: 'Show Settings tab in navigation sidebar',
    enabled: true,
    category: 'pages'
  },
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

const PERSONAL_OVERRIDE_KEY = 'personalOverride';

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [globalDefaults, setGlobalDefaults] = useState<Record<string, boolean>>({});
  const [personalOverride, setPersonalOverrideState] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load global defaults from database and personal overrides from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load global defaults from database
        const dbDefaults = await featureFlagService.getGlobalDefaults();
        setGlobalDefaults(dbDefaults);

        // Load personal overrides from localStorage
        const storedPersonal = localStorage.getItem(PERSONAL_OVERRIDE_KEY);
        if (storedPersonal) {
          try {
            const parsed = JSON.parse(storedPersonal);
            setPersonalOverrideState(parsed);
          } catch (error) {
            console.error('Error loading personal overrides:', error);
          }
        }
      } catch (error) {
        console.error('Error loading feature flag data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update flags whenever global defaults or personal overrides change
  useEffect(() => {
    const updatedFlags = DEFAULT_FLAGS.map(flag => {
      const globalDefault = globalDefaults.hasOwnProperty(flag.key) 
        ? globalDefaults[flag.key] 
        : flag.enabled; // Fallback to hardcoded default
      
      const finalValue = personalOverride.hasOwnProperty(flag.key) 
        ? personalOverride[flag.key] 
        : globalDefault;
      
      return {
        ...flag,
        enabled: finalValue
      };
    });
    setFlags(updatedFlags);
  }, [globalDefaults, personalOverride]);

  const isFeatureEnabled = (key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    return flag ? flag.enabled : false;
  };

  const getGlobalDefault = (key: string): boolean => {
    if (globalDefaults.hasOwnProperty(key)) {
      return globalDefaults[key];
    }
    // Fallback to hardcoded default
    const defaultFlag = DEFAULT_FLAGS.find(f => f.key === key);
    return defaultFlag ? defaultFlag.enabled : false;
  };

  const getPersonalValue = (key: string): boolean => {
    if (personalOverride.hasOwnProperty(key)) {
      return personalOverride[key];
    }
    return getGlobalDefault(key);
  };

  const hasUserOverride = (key: string): boolean => {
    return personalOverride.hasOwnProperty(key);
  };

  const hasPersonalOverride = (key: string): boolean => {
    return personalOverride.hasOwnProperty(key);
  };

  const updateGlobalDefault = async (key: string, enabled: boolean): Promise<boolean> => {
    const success = await featureFlagService.updateGlobalDefault(key, enabled);
    
    if (success) {
      // Update local state immediately for better UX
      setGlobalDefaults(prev => ({
        ...prev,
        [key]: enabled
      }));
    }
    
    return success;
  };

  const setPersonalOverride = (key: string, enabled: boolean) => {
    const currentGlobalDefault = getGlobalDefault(key);
    
    const newPersonalOverride = { ...personalOverride };
    
    if (enabled === currentGlobalDefault) {
      // If setting to match current global default, remove personal override
      delete newPersonalOverride[key];
    } else {
      // Otherwise, set the personal override
      newPersonalOverride[key] = enabled;
    }
    
    setPersonalOverrideState(newPersonalOverride);
    
    // Save to localStorage
    if (Object.keys(newPersonalOverride).length === 0) {
      localStorage.removeItem(PERSONAL_OVERRIDE_KEY);
    } else {
      localStorage.setItem(PERSONAL_OVERRIDE_KEY, JSON.stringify(newPersonalOverride));
    }
  };

  const resetPersonalOverride = (key: string) => {
    const newPersonalOverride = { ...personalOverride };
    delete newPersonalOverride[key];
    
    setPersonalOverrideState(newPersonalOverride);
    
    if (Object.keys(newPersonalOverride).length === 0) {
      localStorage.removeItem(PERSONAL_OVERRIDE_KEY);
    } else {
      localStorage.setItem(PERSONAL_OVERRIDE_KEY, JSON.stringify(newPersonalOverride));
    }
  };

  const toggleFeature = (key: string) => {
    const currentValue = isFeatureEnabled(key);
    setPersonalOverride(key, !currentValue);
  };

  const resetFlagToDefault = (key: string) => {
    resetPersonalOverride(key);
  };

  const resetToDefaults = async () => {
    // Reset personal overrides
    setPersonalOverrideState({});
    localStorage.removeItem(PERSONAL_OVERRIDE_KEY);
    
    // Reset global defaults to hardcoded defaults
    for (const flag of DEFAULT_FLAGS) {
      await featureFlagService.updateGlobalDefault(flag.key, flag.enabled);
    }
    
    // Reload global defaults from database
    const dbDefaults = await featureFlagService.getGlobalDefaults();
    setGlobalDefaults(dbDefaults);
  };

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      isFeatureEnabled,
      toggleFeature,
      resetToDefaults,
      getGlobalDefault,
      hasUserOverride,
      resetFlagToDefault,
      updateGlobalDefault,
      getPersonalValue,
      hasPersonalOverride,
      setPersonalOverride,
      resetPersonalOverride,
      isLoading
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
