
# GM Admin - Venue Management Platform

A comprehensive staff management platform for GM's venue operations, starting with Manor's karaoke and venue hire services, then expanding to support multiple venues including Hippie Club.

## Project Overview

GM Admin is an **admin-only application** designed exclusively for venue staff and managers. This platform provides centralized operations management, automated administrative functions, and data-driven insights to reduce booking administration time by 80%.

### Key Features

- **Centralized Dashboard**: Real-time metrics, today's schedule, and quick actions
- **Booking Management**: Complete booking lifecycle for karaoke and venue hire
- **Customer Database**: Centralized customer information and booking history
- **Analytics & Reporting**: Revenue tracking, performance metrics, and trend analysis
- **Multi-Venue Support**: Scalable architecture for managing multiple venues
- **Mobile Optimization**: Touch-friendly tools for venue floor management

### Target Users

- **Venue Managers**: Day-to-day operational oversight and performance monitoring
- **Staff Members**: Booking creation, customer service, and daily operations
- **Regional Managers**: Multi-venue oversight and strategic planning

## Implementation Roadmap

### Stage 1: Core Management Platform ✅
- Staff Dashboard with key metrics and quick actions
- Booking Management for Manor karaoke and venue hire
- Customer Database with booking history
- Basic automation for confirmations and notifications

### Stage 2: Advanced Analytics (In Progress)
- Enhanced reporting and customer segmentation
- Workflow automation and communication tools
- Administrative tools for promo codes and pricing
- Revenue intelligence and capacity optimization

### Stage 3: Multi-Venue Expansion
- Hippie Club integration
- Cross-venue booking management
- Comparative analytics and benchmarking
- Advanced mobile optimization

### Stage 4: Business Intelligence
- Predictive analytics and forecasting
- Performance optimization tools
- Scalability framework for new venues
- Strategic planning features

## Technologies Used

This project is built with modern web technologies:

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: shadcn/ui component library
- **State Management**: TanStack React Query
- **Icons**: Lucide React
- **Charts**: Recharts for analytics visualization

## Development Setup

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080` with hot-reload enabled.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── revenue/         # Revenue analytics components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── layout/         # Layout components
├── pages/              # Application pages/routes
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── integrations/       # External service integrations (Supabase)

supabase/
├── functions/          # Edge functions for Square sync
└── migrations/         # Database migrations

docs/
├── product/            # Product documentation and PRDs
├── design/             # Design specifications and assets
├── technical/          # Technical documentation
└── user-guides/        # User manuals and guides
```

## Square Integration Architecture

The system uses a simplified Square API integration:

1. **Backend Sync**: `square-sync` function fetches payments and locations from Square
2. **Data Storage**: Revenue data is stored in `revenue_events` table
3. **Frontend**: Unified revenue page displays analytics with monthly/weekly/yearly views
4. **Scheduled Updates**: Automatic sync via `square-cron` function

### Data Flow
```
Square API → square-sync function → revenue_events table → Revenue Analytics Page
```

## Deployment

### Lovable Platform
Simply open [Lovable](https://lovable.dev/projects/d98ece8d-5a7b-4edf-ae49-b14db925e5c2) and click on Share → Publish.

### Custom Domain
To connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow the setup instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Success Metrics

- **Stage 1**: 100% of Manor venue hire bookings processed through the platform
- **Stage 3**: 100% of all bookings across all venues managed through the platform
- **Ultimate Goal**: 80% reduction in time spent on booking administration tasks

## Security & Compliance

- Role-based access control for different user types
- Complete audit trails for all booking and customer data changes
- Secure handling of customer information and payment data
- Staff authentication with session management

## Support & Documentation

- **Product Requirements**: See `docs/product/prd/main-product-prd.md`
- **API Documentation**: Coming in Stage 2
- **User Guides**: Available in `docs/user-guides/`
- **Technical Specs**: See `docs/technical/`

## Contributing

This is an internal GM project. For development questions or feature requests, please contact the development team.

---

**Project URL**: https://lovable.dev/projects/d98ece8d-5a7b-4edf-ae49-b14db925e5c2

<!-- Test deployment - added for shipping process verification -->
