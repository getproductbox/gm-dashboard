
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New User Registration',
    message: 'A new user has registered on the platform',
    type: 'info',
    read: false,
    createdAt: '2024-06-24T10:30:00Z',
    actionUrl: '/users'
  },
  {
    id: '2',
    title: 'System Update Complete',
    message: 'The system has been successfully updated to version 2.1.0',
    type: 'success',
    read: true,
    createdAt: '2024-06-23T14:15:00Z'
  },
  {
    id: '3',
    title: 'Storage Warning',
    message: 'Storage usage is approaching 80% capacity',
    type: 'warning',
    read: false,
    createdAt: '2024-06-23T09:45:00Z',
    actionUrl: '/settings/storage'
  },
  {
    id: '4',
    title: 'Payment Failed',
    message: 'Monthly subscription payment could not be processed',
    type: 'error',
    read: false,
    createdAt: '2024-06-22T16:20:00Z',
    actionUrl: '/billing'
  }
];

export const mockSystemAlerts = [
  {
    id: '1',
    message: 'Scheduled maintenance on June 25th from 2:00 AM to 4:00 AM EST',
    type: 'info' as const,
    dismissible: true
  },
  {
    id: '2',
    message: 'New features available! Check out the latest updates.',
    type: 'success' as const,
    dismissible: true
  }
];
