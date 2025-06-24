
export interface UserSettings {
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

export interface ApiEndpoint {
  id: string;
  url: string;
  method: string;
  status: 'active' | 'warning' | 'error';
  responseTime: number;
  lastChecked: string;
}

export const mockUserSettings: UserSettings = {
  theme: 'light',
  language: 'en',
  timezone: 'America/New_York',
  emailNotifications: true,
  pushNotifications: false,
  twoFactorEnabled: false,
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showLastSeen: true,
  },
};

export const mockSystemSettings: SystemSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx'],
  sessionTimeout: 30 * 60, // 30 minutes
};

export const mockApiEndpoints: ApiEndpoint[] = [
  {
    id: '1',
    url: '/api/bookings',
    method: 'GET',
    status: 'active',
    responseTime: 120,
    lastChecked: '2024-06-24T10:30:00Z',
  },
  {
    id: '2',
    url: '/api/customers',
    method: 'POST',
    status: 'active',
    responseTime: 95,
    lastChecked: '2024-06-24T10:29:00Z',
  },
  {
    id: '3',
    url: '/api/payments',
    method: 'POST',
    status: 'warning',
    responseTime: 340,
    lastChecked: '2024-06-24T10:28:00Z',
  },
  {
    id: '4',
    url: '/api/notifications',
    method: 'GET',
    status: 'error',
    responseTime: 0,
    lastChecked: '2024-06-24T10:25:00Z',
  },
];
