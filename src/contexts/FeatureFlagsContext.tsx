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
  getDefaultValue: (key: string) => boolean;
  hasUserOverride: (key: string) => boolean;
  resetFlagToDefault: (key: string) => void;
  updateDefaultValue: (key: string, enabled: boolean) => void;
  getPersonalValue: (key: string) => boolean;
  hasPersonalOverride: (key: string) => boolean;
  setPersonalOverride: (key: string, enabled: boolean) => void;
  resetPersonalOverride: (key: string) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

// Default feature flags that apply to all users
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

const DEFAULTS_OVERRIDE_KEY = 'defaultsOverride';
const PERSONAL_OVERRIDE_KEY = 'personalOverride';

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [defaultsOverride, setDefaultsOverride] = useState<Record<string, boolean>>({});
  const [personalOverride, setPersonalOverrideState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load default overrides from localStorage
    const storedDefaults = localStorage.getItem(DEFAULTS_OVERRIDE_KEY);
    if (storedDefaults) {
      try {
        const parsed = JSON.parse(storedDefaults);
        setDefaultsOverride(parsed);
      } catch (error) {
        console.error('Error loading default overrides:', error);
      }
    }

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
  }, []);

  // Update flags whenever overrides change
  useEffect(() => {
    const updatedFlags = DEFAULT_FLAGS.map(flag => {
      const currentDefault = defaultsOverride.hasOwnProperty(flag.key) ? defaultsOverride[flag.key] : flag.enabled;
      const finalValue = personalOverride.hasOwnProperty(flag.key) ? personalOverride[flag.key] : currentDefault;
      
      return {
        ...flag,
        enabled: finalValue
      };
    });
    setFlags(updatedFlags);
  }, [defaultsOverride, personalOverride]);

  const isFeatureEnabled = (key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    return flag ? flag.enabled : false;
  };

  const getDefaultValue = (key: string): boolean => {
    // Check if there's a default override first, then fall back to original default
    if (defaultsOverride.hasOwnProperty(key)) {
      return defaultsOverride[key];
    }
    const defaultFlag = DEFAULT_FLAGS.find(f => f.key === key);
    return defaultFlag ? defaultFlag.enabled : false;
  };

  const getPersonalValue = (key: string): boolean => {
    if (personalOverride.hasOwnProperty(key)) {
      return personalOverride[key];
    }
    return getDefaultValue(key);
  };

  const hasUserOverride = (key: string): boolean => {
    return personalOverride.hasOwnProperty(key);
  };

  const hasPersonalOverride = (key: string): boolean => {
    return personalOverride.hasOwnProperty(key);
  };

  const updateDefaultValue = (key: string, enabled: boolean) => {
    const originalDefault = DEFAULT_FLAGS.find(f => f.key === key)?.enabled ?? false;
    
    const newDefaultsOverride = { ...defaultsOverride };
    
    if (enabled === originalDefault) {
      // If setting back to original default, remove the override
      delete newDefaultsOverride[key];
    } else {
      // Otherwise, set the override
      newDefaultsOverride[key] = enabled;
    }
    
    setDefaultsOverride(newDefaultsOverride);
    
    // Save to localStorage
    if (Object.keys(newDefaultsOverride).length === 0) {
      localStorage.removeItem(DEFAULTS_OVERRIDE_KEY);
    } else {
      localStorage.setItem(DEFAULTS_OVERRIDE_KEY, JSON.stringify(newDefaultsOverride));
    }
  };

  const setPersonalOverride = (key: string, enabled: boolean) => {
    const currentDefault = getDefaultValue(key);
    
    const newPersonalOverride = { ...personalOverride };
    
    if (enabled === currentDefault) {
      // If setting to match current default, remove personal override
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

  const resetToDefaults = () => {
    setDefaultsOverride({});
    setPersonalOverrideState({});
    localStorage.removeItem(DEFAULTS_OVERRIDE_KEY);
    localStorage.removeItem(PERSONAL_OVERRIDE_KEY);
  };

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      isFeatureEnabled,
      toggleFeature,
      resetToDefaults,
      getDefaultValue,
      hasUserOverride,
      resetFlagToDefault,
      updateDefaultValue,
      getPersonalValue,
      hasPersonalOverride,
      setPersonalOverride,
      resetPersonalOverride
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
