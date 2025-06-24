
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLastSeen: boolean;
  };
}

export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
}

export const mockUserSettings: UserSettings = {
  id: '1',
  userId: '1',
  theme: 'light',
  language: 'en',
  timezone: 'America/New_York',
  emailNotifications: true,
  pushNotifications: false,
  twoFactorEnabled: true,
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showLastSeen: true
  }
};

export const mockSystemSettings: SystemSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  maxFileSize: 10485760, // 10MB in bytes
  allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  sessionTimeout: 3600 // 1 hour in seconds
};

export const mockApiEndpoints = [
  {
    id: '1',
    name: 'Users API',
    url: '/api/users',
    method: 'GET',
    status: 'active',
    responseTime: 245,
    lastChecked: '2024-06-24T12:00:00Z'
  },
  {
    id: '2',
    name: 'Products API',
    url: '/api/products',
    method: 'GET',
    status: 'active',
    responseTime: 180,
    lastChecked: '2024-06-24T12:00:00Z'
  },
  {
    id: '3',
    name: 'Analytics API',
    url: '/api/analytics',
    method: 'POST',
    status: 'warning',
    responseTime: 890,
    lastChecked: '2024-06-24T11:55:00Z'
  }
];
