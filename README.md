
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
- **External Booking Widget**: Embeddable booking form for marketing websites

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
- **Backend**: Supabase for database and Edge Functions
- **Widget**: Standalone embeddable booking form

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
├── functions/          # Edge functions for Square sync and booking API
└── migrations/         # Database migrations

widget-deploy/          # Standalone booking widget for external sites
├── gm-booking-widget-standalone.js
├── widget.css
└── widget-loader.js

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

## External Booking Widget

The platform includes an embeddable booking widget for marketing websites:

- **Widget URL**: `https://booking-widget.getproductbox.com`
- **API Endpoint**: `https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/public-booking-api`
- **Supported Booking Types**: Venue hire and VIP tickets
- **Pre-configuration**: Supports venue and booking type pre-selection

### Widget Integration
```html
<script src="https://booking-widget.getproductbox.com/widget-loader.js"></script>
<script>
  window.GMBookingWidget.init({
    preConfig: {
      venue: 'manor',
      bookingType: 'vip_tickets'
    }
  });
</script>
```

## Deployment

### Production Deployment
The application is deployed using PowerShell scripts for automated deployment:

```powershell
# Deploy to production
.\scripts\deploy.ps1
```

### Widget Deployment
The booking widget is hosted on Netlify at `booking-widget.getproductbox.com` and can be updated by replacing files in the `widget-deploy/` directory.

### Custom Domain
The application is hosted at `gm-dashboard.getproductbox.com` with custom domain configuration.

## Success Metrics

- **Stage 1**: 100% of Manor venue hire bookings processed through the platform
- **Stage 3**: 100% of all bookings across all venues managed through the platform
- **Ultimate Goal**: 80% reduction in time spent on booking administration tasks

## Security & Compliance

- Role-based access control for different user types
- Complete audit trails for all booking and customer data changes
- Secure handling of customer information and payment data
- Staff authentication with session management
- API key authentication for external booking widget

## Support & Documentation

- **Product Requirements**: See `docs/product/prd/main-product-prd.md`
- **API Documentation**: See `docs/technical/`
- **User Guides**: Available in `docs/user-guides/`
- **Technical Specs**: See `docs/technical/`

## Contributing

This is an internal GM project. For development questions or feature requests, please contact the development team.

---

**Production URL**: https://gm-dashboard.getproductbox.com
**Widget URL**: https://booking-widget.getproductbox.com
