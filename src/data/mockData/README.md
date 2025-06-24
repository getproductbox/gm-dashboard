
# Mock Data Directory

This directory contains organized mock data for different sections of the application to facilitate development before backend integration.

## Structure

- `users.ts` - User profiles, authentication data, and user-related mock data
- `products.ts` - Product catalog, categories, and inventory mock data  
- `analytics.ts` - Dashboard metrics, charts, and analytics mock data
- `notifications.ts` - System notifications, alerts, and messaging mock data
- `settings.ts` - User preferences, system configuration, and API endpoint mock data
- `index.ts` - Central export file for easy importing

## Usage

Import specific mock data sets:

```typescript
import { mockUsers, mockUserProfiles } from '@/data/mockData/users';
import { mockProducts, mockCategories } from '@/data/mockData/products';
import { mockAnalytics, mockChartData } from '@/data/mockData/analytics';
```

Or import everything from the central export:

```typescript
import { mockUsers, mockProducts, mockAnalytics } from '@/data/mockData';
```

## Adding New Mock Data

1. Create a new file for your data category
2. Define TypeScript interfaces for type safety
3. Export your mock data and interfaces
4. Add the export to `index.ts`

## Guidelines

- Keep mock data realistic and representative of actual use cases
- Include edge cases and various states (active, inactive, pending, etc.)
- Use proper TypeScript typing for all mock data
- Include timestamps in ISO format for consistency
- Provide both individual items and collections where appropriate
