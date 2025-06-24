
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Widget',
    description: 'High-quality widget for professional use',
    price: 299.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=300&h=200&fit=crop',
    stock: 25,
    status: 'active',
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-06-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Standard Tool',
    description: 'Reliable tool for everyday tasks',
    price: 89.99,
    category: 'Tools',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
    stock: 50,
    status: 'active',
    createdAt: '2024-02-15T09:15:00Z',
    updatedAt: '2024-06-22T14:20:00Z'
  },
  {
    id: '3',
    name: 'Luxury Accessory',
    description: 'Premium accessory with advanced features',
    price: 549.99,
    category: 'Accessories',
    stock: 8,
    status: 'draft',
    createdAt: '2024-06-01T16:45:00Z',
    updatedAt: '2024-06-24T11:10:00Z'
  }
];

export const mockCategories = [
  { id: '1', name: 'Electronics', count: 15 },
  { id: '2', name: 'Tools', count: 23 },
  { id: '3', name: 'Accessories', count: 12 },
  { id: '4', name: 'Software', count: 8 }
];
