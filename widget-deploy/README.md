# GM Booking Widget

A standalone embeddable booking widget for external marketing websites.

## Overview

The GM Booking Widget allows external websites to embed a booking form that creates bookings directly in the GM dashboard system. The widget supports both venue hire and VIP ticket bookings.

## Files

- `gm-booking-widget-standalone-fixed.js` - Main widget JavaScript file
- `widget.css` - Widget styles
- `widget-loader.js` - Widget loader script for embedding
- `index.html` - Demo page for testing the widget
- `test.html` - Additional test page

## Deployment

The widget is hosted on Netlify at: `https://booking-widget.getproductbox.com`

### Updating the Widget

1. Make changes to the widget files in this directory
2. Replace the corresponding files on Netlify
3. The widget will be immediately available at the hosted URL

## API Integration

The widget connects to the GM booking API at:
`https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/public-booking-api`

### Authentication
- **Method**: Bearer Token
- **Token**: Service role key from Supabase

### Supported Booking Types

**VIP Tickets:**
- Date must be a Saturday
- Ticket quantity: 1-100
- Venue-specific (Manor/Hippie)

**Venue Hire:**
- Any future date
- Venue area selection (upstairs/downstairs/full_venue)
- Guest count required
- Optional start/end times

## Widget Integration

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

## Pre-configuration Options

- `venue`: 'manor' | 'hippie'
- `bookingType`: 'venue_hire' | 'vip_tickets'

## Development

To test the widget locally:
1. Open `index.html` in a browser
2. The widget will load and be functional for testing

## Testing

Use the test pages to verify:
- Form validation
- API integration
- Pre-configuration
- Error handling
- Success flows 