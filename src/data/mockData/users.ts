
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-06-24T08:15:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b302?w=32&h=32&fit=crop&crop=face',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-20T14:45:00Z',
    lastLogin: '2024-06-23T16:30:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'moderator',
    status: 'pending',
    createdAt: '2024-06-20T09:00:00Z'
  }
];

export const mockUserProfiles = {
  currentUser: mockUsers[0],
  recentUsers: mockUsers.slice(0, 5)
};
