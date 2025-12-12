# GM Platform - UX/UI Design System Specification

## Design Philosophy

### Core Principles

**1. Efficiency First**
The platform prioritizes speed and ease of use for both customers and staff. Every interaction should feel immediate and reduce cognitive load.

**2. Clarity Over Cleverness**
Information hierarchy is clear, actions are obvious, and the interface guides users naturally through their tasks without confusion.

**3. Consistent Multi-Context**
The design system works seamlessly across customer-facing booking flows and staff management interfaces while maintaining brand coherence.

**4. Accessible by Default**
All components meet WCAG 2.1 AA standards, ensuring the platform is usable by everyone regardless of ability or device.

**5. Scalable Foundation**
The design system anticipates growth from single-venue to multi-venue operations without requiring fundamental redesign.

### Brand Personality

**Professional yet Approachable**: Competent and reliable without being cold or intimidating
**Energetic but Controlled**: Reflects the entertainment industry while maintaining business focus
**Modern and Forward-Thinking**: Contemporary design that feels innovative but not experimental

## Visual Identity

### Color System

\`\`\`css
/* Primary Palette - Energy & Action */
--gm-primary-50: #fff7ed;
--gm-primary-100: #ffedd5;
--gm-primary-200: #fed7aa;
--gm-primary-300: #fdba74;
--gm-primary-400: #fb923c;
--gm-primary-500: #f97316; /* Primary brand color */
--gm-primary-600: #ea580c;
--gm-primary-700: #c2410c;
--gm-primary-800: #9a3412;
--gm-primary-900: #7c2d12;

/* Neutral Palette - Foundation */
--gm-neutral-0: #ffffff;
--gm-neutral-50: #fafaf9;
--gm-neutral-100: #f5f5f4;
--gm-neutral-200: #e7e5e4;
--gm-neutral-300: #d6d3d1;
--gm-neutral-400: #a8a29e;
--gm-neutral-500: #78716c;
--gm-neutral-600: #57534e;
--gm-neutral-700: #44403c;
--gm-neutral-800: #292524;
--gm-neutral-900: #1c1917;

/* Semantic Colors */
--gm-success-50: #f0fdf4;
--gm-success-500: #22c55e;
--gm-success-700: #15803d;

--gm-warning-50: #fffbeb;
--gm-warning-500: #f59e0b;
--gm-warning-700: #b45309;

--gm-error-50: #fef2f2;
--gm-error-500: #ef4444;
--gm-error-700: #b91c1c;

--gm-info-50: #eff6ff;
--gm-info-500: #3b82f6;
--gm-info-700: #1d4ed8;

/* Contextual Applications */
--gm-booking-confirmed: var(--gm-success-500);
--gm-booking-pending: var(--gm-warning-500);
--gm-booking-cancelled: var(--gm-neutral-400);
--gm-revenue-positive: var(--gm-success-600);
--gm-priority-high: var(--gm-error-500);
\`\`\`

### Typography System

\`\`\`css
/* Font Stack */
--gm-font-primary: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--gm-font-mono: 'JetBrains Mono', Consolas, 'Courier New', monospace;

/* Type Scale - Perfect Fourth (1.333) */
--gm-text-xs: 0.75rem;     /* 12px */
--gm-text-sm: 0.875rem;    /* 14px */
--gm-text-base: 1rem;      /* 16px - Base size */
--gm-text-lg: 1.125rem;    /* 18px */
--gm-text-xl: 1.333rem;    /* 21px */
--gm-text-2xl: 1.777rem;   /* 28px */
--gm-text-3xl: 2.369rem;   /* 38px */
--gm-text-4xl: 3.157rem;   /* 51px */

/* Line Heights */
--gm-leading-tight: 1.25;
--gm-leading-normal: 1.5;
--gm-leading-relaxed: 1.75;

/* Font Weights - Optimized for Plus Jakarta Sans */
--gm-font-light: 300;
--gm-font-normal: 400;
--gm-font-medium: 500;
--gm-font-semibold: 600;
--gm-font-bold: 700;
--gm-font-extrabold: 800;

/* Typography Components */
.gm-heading-1 {
  font-size: var(--gm-text-4xl);
  font-weight: 800; /* ExtraBold for Plus Jakarta Sans */
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.gm-heading-2 {
  font-size: var(--gm-text-3xl);
  font-weight: 700; /* Bold */
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.gm-heading-3 {
  font-size: var(--gm-text-2xl);
  font-weight: 600; /* SemiBold */
  line-height: 1.25;
  letter-spacing: -0.015em;
}

.gm-body-large {
  font-size: var(--gm-text-lg);
  font-weight: 400; /* Regular */
  line-height: 1.6;
}

.gm-body {
  font-size: var(--gm-text-base);
  font-weight: 400; /* Regular */
  line-height: 1.5;
}

.gm-body-small {
  font-size: var(--gm-text-sm);
  font-weight: 400; /* Regular */
  line-height: 1.4;
}

.gm-caption {
  font-size: var(--gm-text-xs);
  font-weight: 500; /* Medium */
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
\`\`\`

### Spacing System

\`\`\`css
/* Spatial Scale - Base 4px */
--gm-space-0: 0;
--gm-space-1: 0.25rem;   /* 4px */
--gm-space-2: 0.5rem;    /* 8px */
--gm-space-3: 0.75rem;   /* 12px */
--gm-space-4: 1rem;      /* 16px - Base unit */
--gm-space-5: 1.25rem;   /* 20px */
--gm-space-6: 1.5rem;    /* 24px */
--gm-space-8: 2rem;      /* 32px */
--gm-space-10: 2.5rem;   /* 40px */
--gm-space-12: 3rem;     /* 48px */
--gm-space-16: 4rem;     /* 64px */
--gm-space-20: 5rem;     /* 80px */
--gm-space-24: 6rem;     /* 96px */

/* Component Spacing */
--gm-space-component-xs: var(--gm-space-2);
--gm-space-component-sm: var(--gm-space-4);
--gm-space-component-md: var(--gm-space-6);
--gm-space-component-lg: var(--gm-space-8);
--gm-space-component-xl: var(--gm-space-12);

/* Layout Spacing */
--gm-space-section: var(--gm-space-16);
--gm-space-page: var(--gm-space-20);
\`\`\`

### Elevation & Shadows

\`\`\`css
/* Shadow System */
--gm-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--gm-shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--gm-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--gm-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--gm-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Elevation Levels */
--gm-elevation-0: none;                    /* Base level */
--gm-elevation-1: var(--gm-shadow-sm);     /* Cards, buttons */
--gm-elevation-2: var(--gm-shadow-base);   /* Raised cards */
--gm-elevation-3: var(--gm-shadow-md);     /* Dropdowns, tooltips */
--gm-elevation-4: var(--gm-shadow-lg);     /* Modals, overlays */
--gm-elevation-5: var(--gm-shadow-xl);     /* Maximum elevation */
\`\`\`

### Border Radius System

\`\`\`css
--gm-radius-none: 0;
--gm-radius-sm: 0.25rem;    /* 4px - Small elements */
--gm-radius-base: 0.5rem;   /* 8px - Default */
--gm-radius-md: 0.75rem;    /* 12px - Cards */
--gm-radius-lg: 1rem;       /* 16px - Large cards */
--gm-radius-xl: 1.5rem;     /* 24px - Hero elements */
--gm-radius-full: 9999px;   /* Pills, avatars */
\`\`\`

## Atomic Design System

### Atoms (Base Elements)

#### Buttons

\`\`\`css
/* Button Base Styles */
.gm-button {
  font-family: var(--gm-font-primary);
  font-weight: var(--gm-font-medium);
  border-radius: var(--gm-radius-base);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gm-space-2);
  transition: all 150ms ease-in-out;
  text-decoration: none;
  
  &:focus-visible {
    outline: 2px solid var(--gm-primary-500);
    outline-offset: 2px;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

/* Button Sizes */
.gm-button--sm {
  padding: var(--gm-space-2) var(--gm-space-3);
  font-size: var(--gm-text-sm);
  min-height: 2rem;
}

.gm-button--md {
  padding: var(--gm-space-3) var(--gm-space-4);
  font-size: var(--gm-text-base);
  min-height: 2.5rem;
}

.gm-button--lg {
  padding: var(--gm-space-4) var(--gm-space-6);
  font-size: var(--gm-text-lg);
  min-height: 3rem;
}

/* Button Variants */
.gm-button--primary {
  background-color: var(--gm-primary-500);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--gm-primary-600);
    transform: translateY(-1px);
    box-shadow: var(--gm-elevation-2);
  }
  
  &:active {
    transform: translateY(0);
    background-color: var(--gm-primary-700);
  }
}

.gm-button--secondary {
  background-color: var(--gm-neutral-0);
  color: var(--gm-neutral-700);
  border: 1px solid var(--gm-neutral-300);
  
  &:hover:not(:disabled) {
    background-color: var(--gm-neutral-50);
    border-color: var(--gm-neutral-400);
  }
}

.gm-button--ghost {
  background-color: transparent;
  color: var(--gm-primary-600);
  
  &:hover:not(:disabled) {
    background-color: var(--gm-primary-50);
  }
}
\`\`\`

#### Form Inputs

\`\`\`css
.gm-input {
  font-family: var(--gm-font-primary);
  font-size: var(--gm-text-base);
  padding: var(--gm-space-3) var(--gm-space-4);
  border: 1px solid var(--gm-neutral-300);
  border-radius: var(--gm-radius-base);
  background-color: var(--gm-neutral-0);
  transition: all 150ms ease-in-out;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: var(--gm-primary-500);
    box-shadow: 0 0 0 3px var(--gm-primary-50);
  }
  
  &:invalid {
    border-color: var(--gm-error-500);
  }
  
  &::placeholder {
    color: var(--gm-neutral-400);
  }
}

.gm-input--error {
  border-color: var(--gm-error-500);
  
  &:focus {
    box-shadow: 0 0 0 3px var(--gm-error-50);
  }
}
\`\`\`

#### Icons

\`\`\`css
.gm-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  flex-shrink: 0;
}

.gm-icon--sm { width: 1rem; height: 1rem; }
.gm-icon--md { width: 1.25rem; height: 1.25rem; }
.gm-icon--lg { width: 1.5rem; height: 1.5rem; }
.gm-icon--xl { width: 2rem; height: 2rem; }
\`\`\`

### Molecules (Component Combinations)

#### Form Field

\`\`\`jsx
interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  children
}) => {
  return (
    <div className="gm-form-field">
      <label className="gm-form-field__label">
        {label}
        {required && <span className="gm-form-field__required">*</span>}
      </label>
      
      {hint && (
        <p className="gm-form-field__hint">{hint}</p>
      )}
      
      <div className="gm-form-field__input">
        {children}
      </div>
      
      {error && (
        <p className="gm-form-field__error" role="alert">
          <Icon name="alert-circle" className="gm-icon--sm" />
          {error}
        </p>
      )}
    </div>
  );
};
\`\`\`

#### Status Badge

\`\`\`jsx
interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const baseClasses = 'gm-status-badge';
  const sizeClasses = size === 'sm' ? 'gm-status-badge--sm' : 'gm-status-badge--md';
  const statusClasses = `gm-status-badge--${status}`;
  
  return (
    <span className={`${baseClasses} ${sizeClasses} ${statusClasses}`}>
      <Icon name={getStatusIcon(status)} className="gm-icon--sm" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
\`\`\`

#### Time Slot Selector

\`\`\`jsx
interface TimeSlot {
  startTime: string;
  endTime: string;
  price: number;
  available: boolean;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selected?: string;
  onSelect: (startTime: string) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selected,
  onSelect
}) => {
  return (
    <div className="gm-time-slot-selector">
      <h3 className="gm-time-slot-selector__title">Available Times</h3>
      <div className="gm-time-slot-selector__grid">
        {slots.map((slot) => (
          <button
            key={slot.startTime}
            className={`gm-time-slot ${
              selected === slot.startTime ? 'gm-time-slot--selected' : ''
            } ${
              !slot.available ? 'gm-time-slot--unavailable' : ''
            }`}
            onClick={() => slot.available && onSelect(slot.startTime)}
            disabled={!slot.available}
          >
            <span className="gm-time-slot__time">
              {formatTime(slot.startTime)}
            </span>
            <span className="gm-time-slot__price">
              ${slot.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
\`\`\`

### Organisms (Complex Components)

#### Booking Summary Card

\`\`\`jsx
interface BookingSummaryProps {
  booking: {
    service: string;
    date: string;
    time: string;
    duration: number;
    guests: number;
    venue: string;
    room?: string;
  };
  pricing: {
    basePrice: number;
    fees: Array<{ name: string; amount: number }>;
    discount?: number;
    total: number;
  };
  onEdit?: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  booking,
  pricing,
  onEdit
}) => {
  return (
    <div className="gm-booking-summary">
      <div className="gm-booking-summary__header">
        <h3 className="gm-booking-summary__title">Booking Summary</h3>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Icon name="edit" /> Edit
          </Button>
        )}
      </div>
      
      <div className="gm-booking-summary__details">
        <div className="gm-booking-detail">
          <Icon name="calendar" className="gm-booking-detail__icon" />
          <div>
            <p className="gm-booking-detail__label">Date & Time</p>
            <p className="gm-booking-detail__value">
              {formatDate(booking.date)} at {booking.time}
            </p>
          </div>
        </div>
        
        <div className="gm-booking-detail">
          <Icon name="clock" className="gm-booking-detail__icon" />
          <div>
            <p className="gm-booking-detail__label">Duration</p>
            <p className="gm-booking-detail__value">{booking.duration} hours</p>
          </div>
        </div>
        
        <div className="gm-booking-detail">
          <Icon name="users" className="gm-booking-detail__icon" />
          <div>
            <p className="gm-booking-detail__label">Guests</p>
            <p className="gm-booking-detail__value">{booking.guests} people</p>
          </div>
        </div>
      </div>
      
      <div className="gm-booking-summary__pricing">
        <div className="gm-pricing-line">
          <span>Base price ({booking.duration}h)</span>
          <span>${pricing.basePrice.toFixed(2)}</span>
        </div>
        
        {pricing.fees.map((fee) => (
          <div key={fee.name} className="gm-pricing-line gm-pricing-line--fee">
            <span>{fee.name}</span>
            <span>${fee.amount.toFixed(2)}</span>
          </div>
        ))}
        
        {pricing.discount && (
          <div className="gm-pricing-line gm-pricing-line--discount">
            <span>Discount</span>
            <span>-${pricing.discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="gm-pricing-line gm-pricing-line--total">
          <span>Total</span>
          <span>${pricing.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
\`\`\`

#### Staff Dashboard Calendar

\`\`\`jsx
interface CalendarProps {
  date: Date;
  bookings: CalendarBooking[];
  resources: Resource[];
  onBookingClick: (booking: CalendarBooking) => void;
  onSlotClick: (resource: Resource, time: string) => void;
}

const StaffCalendar: React.FC<CalendarProps> = ({
  date,
  bookings,
  resources,
  onBookingClick,
  onSlotClick
}) => {
  return (
    <div className="gm-staff-calendar">
      <div className="gm-staff-calendar__header">
        <h2 className="gm-staff-calendar__date">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="gm-staff-calendar__controls">
          <Button variant="secondary" size="sm">
            <Icon name="chevron-left" />
          </Button>
          <Button variant="secondary" size="sm">
            Today
          </Button>
          <Button variant="secondary" size="sm">
            <Icon name="chevron-right" />
          </Button>
        </div>
      </div>
      
      <div className="gm-staff-calendar__grid">
        <div className="gm-staff-calendar__time-column">
          {generateTimeSlots().map((time) => (
            <div key={time} className="gm-staff-calendar__time-slot">
              {time}
            </div>
          ))}
        </div>
        
        {resources.map((resource) => (
          <CalendarResourceColumn
            key={resource.id}
            resource={resource}
            bookings={bookings.filter(b => b.resourceId === resource.id)}
            onBookingClick={onBookingClick}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  );
};
\`\`\`

## Layout Systems

### Grid System

\`\`\`css
.gm-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--gm-space-4);
}

.gm-container--narrow {
  max-width: 768px;
}

.gm-container--wide {
  max-width: 1440px;
}

.gm-grid {
  display: grid;
  gap: var(--gm-space-6);
}

.gm-grid--2 { grid-template-columns: repeat(2, 1fr); }
.gm-grid--3 { grid-template-columns: repeat(3, 1fr); }
.gm-grid--4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
  .gm-grid--2,
  .gm-grid--3,
  .gm-grid--4 {
    grid-template-columns: 1fr;
  }
}
\`\`\`

### Page Layouts

#### Customer Layout

\`\`\`jsx
const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <div className="gm-customer-layout">
      <header className="gm-customer-header">
        <div className="gm-container">
          <nav className="gm-customer-nav">
            <Logo />
            <div className="gm-customer-nav__actions">
              <Button variant="ghost">Sign In</Button>
              <Button variant="primary">Book Now</Button>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="gm-customer-main">
        {children}
      </main>
      
      <footer className="gm-customer-footer">
        <div className="gm-container">
          <p>&copy; 2025 GM Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
\`\`\`

#### Staff Dashboard Layout

\`\`\`jsx
const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <div className="gm-staff-layout">
      <aside className="gm-staff-sidebar">
        <div className="gm-staff-sidebar__header">
          <Logo variant="compact" />
        </div>
        <nav className="gm-staff-sidebar__nav">
          <NavItem icon="home" href="/dashboard">Dashboard</NavItem>
          <NavItem icon="calendar" href="/bookings">Bookings</NavItem>
          <NavItem icon="users" href="/customers">Customers</NavItem>
          <NavItem icon="bar-chart" href="/reports">Reports</NavItem>
          <NavItem icon="settings" href="/settings">Settings</NavItem>
        </nav>
      </aside>
      
      <div className="gm-staff-content">
        <header className="gm-staff-header">
          <div className="gm-staff-header__title">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="gm-staff-header__actions">
            <VenueSelector />
            <UserMenu />
          </div>
        </header>
        
        <main className="gm-staff-main">
          {children}
        </main>
      </div>
    </div>
  );
};
\`\`\`

## Responsive Design

### Breakpoint System

\`\`\`css
/* Mobile-first breakpoints */
:root {
  --gm-screen-sm: 640px;   /* Small devices */
  --gm-screen-md: 768px;   /* Tablets */
  --gm-screen-lg: 1024px;  /* Laptops */
  --gm-screen-xl: 1280px;  /* Desktops */
  --gm-screen-2xl: 1536px; /* Large screens */
}

/* Responsive utilities */
@media (min-width: 640px) { .gm-sm\:hidden { display: none; } }
@media (min-width: 768px) { .gm-md\:block { display: block; } }
@media (min-width: 1024px) { .gm-lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); } }
\`\`\`

### Component Adaptations

\`\`\`jsx
// Responsive time slot selector
const TimeSlotSelector: React.FC<Props> = ({ slots }) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={`gm-time-slot-selector ${
      isMobile ? 'gm-time-slot-selector--mobile' : ''
    }`}>
      {isMobile ? (
        <select className="gm-time-slot-select">
          {slots.map(slot => (
            <option key={slot.startTime} value={slot.startTime}>
              {formatTime(slot.startTime)} - ${slot.price}
            </option>
          ))}
        </select>
      ) : (
        <div className="gm-time-slot-grid">
          {slots.map(slot => (
            <TimeSlotButton key={slot.startTime} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
};
\`\`\`

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

\`\`\`css
/* Focus indicators */
.gm-focus-visible {
  outline: 2px solid var(--gm-primary-500);
  outline-offset: 2px;
}

/* Color contrast requirements */
.gm-text-contrast {
  color: var(--gm-neutral-700); /* 4.5:1 contrast ratio minimum */
}

/* Motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

### Semantic HTML Patterns

\`\`\`jsx
// Accessible form component
const AccessibleForm: React.FC = () => {
  return (
    <form role="form" aria-labelledby="booking-form-title">
      <h2 id="booking-form-title">Make a Booking</h2>
      
      <fieldset>
        <legend>Booking Details</legend>
        
        <FormField label="Date" required>
          <input
            type="date"
            aria-describedby="date-hint"
            aria-required="true"
          />
          <div id="date-hint" className="gm-form-hint">
            Select your preferred booking date
          </div>
        </FormField>
      </fieldset>
      
      <div role="status" aria-live="polite" aria-atomic="true">
        {validationMessage}
      </div>
    </form>
  );
};
