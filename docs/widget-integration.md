# GM Booking Widget - Integration Guide

## Overview

The GM Booking Widget allows you to embed booking forms directly into your marketing websites. The widget connects to your GM Dashboard backend and creates bookings in real-time.

## Quick Start

### 1. Include Required Files

Add these lines to your HTML `<head>` section:

```html
<!-- Widget CSS -->
<link rel="stylesheet" href="https://your-domain.com/widget/widget.css">

<!-- Widget JavaScript -->
<script src="https://your-domain.com/widget/gm-booking-widget-standalone.js"></script>
```

### 2. Add Widget Container

Place this HTML where you want the booking form to appear:

```html
<div data-gm-widget="booking" 
     data-venue="both" 
     data-theme="light">
</div>
```

That's it! The widget will automatically initialize and display the booking form.

## Configuration Options

### Data Attributes

You can customize the widget using data attributes on the container element:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-venue` | `"manor"`, `"hippie"`, `"both"` | Which venues to show in the dropdown |
| `data-venue-area` | `"upstairs"`, `"downstairs"`, `"full_venue"` | Default venue area selection |
| `data-theme` | `"light"`, `"dark"` | Widget theme |
| `data-primary-color` | Any CSS color | Primary button color |
| `data-show-special-requests` | `"true"`, `"false"` | Show/hide special requests field |
| `data-api-endpoint` | URL | Custom API endpoint |
| `data-api-key` | String | Custom API key |

### Examples

**Basic Manor Booking:**
```html
<div data-gm-widget="booking"
     data-venue="manor"
     data-venue-area="upstairs"
     data-theme="light">
</div>
```

**Dark Theme Hippie Venue:**
```html
<div data-gm-widget="booking"
     data-venue="hippie"
     data-venue-area="full_venue"
     data-theme="dark"
     data-primary-color="#ff6b6b">
</div>
```

**Custom API Configuration:**
```html
<div data-gm-widget="booking"
     data-api-endpoint="https://your-api.com/booking"
     data-api-key="your-custom-key">
</div>
```

## JavaScript API

For advanced integration, you can initialize the widget programmatically:

```javascript
// Configuration object
const config = {
  venue: 'manor',
  defaultVenueArea: 'upstairs',
  theme: 'light',
  primaryColor: '#007bff',
  showSpecialRequests: true,
  apiEndpoint: 'https://your-api.com/endpoint',
  apiKey: 'your-api-key'
};

// Get container element
const container = document.getElementById('booking-widget');

// Initialize widget
GMBookingWidget(container, config);
```

## Widget Features

### ✅ Form Fields
- **Customer Name** (required)
- **Email** (optional, but either email or phone required)
- **Phone** (optional, but either email or phone required)
- **Venue Selection** (Manor/Hippie)
- **Venue Area** (Upstairs/Downstairs/Full Venue)
- **Booking Date** (required, no past dates)
- **Start Time** (optional)
- **End Time** (optional)
- **Guest Count** (required, minimum 1)
- **Special Requests** (optional, configurable)

### ✅ Validation
- Real-time form validation
- Date validation (no past dates)
- Email format validation
- Required field validation
- Guest count validation

### ✅ User Experience
- Loading states during submission
- Success/error messages
- Form reset after successful booking
- Responsive design
- Accessible form controls

### ✅ Styling
- Light and dark themes
- Customizable primary color
- Responsive design
- Mobile-friendly
- Consistent with modern UI patterns

## API Integration

The widget communicates with your GM Dashboard backend through the booking API:

### Request Format
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+44 123 456 7890",
  "venue": "manor",
  "venueArea": "upstairs",
  "bookingDate": "2024-01-15",
  "startTime": "14:00",
  "endTime": "18:00",
  "guestCount": 8,
  "specialRequests": "Birthday party setup"
}
```

### Response Format
```json
{
  "success": true,
  "bookingId": "uuid-here",
  "message": "Booking created successfully"
}
```

## Security

### API Key Authentication
The widget uses API key authentication to secure requests. Include your API key in the configuration:

```html
<div data-gm-widget="booking"
     data-api-key="your-secure-api-key">
</div>
```

### Rate Limiting
The backend includes rate limiting to prevent abuse. Default limits:
- 10 requests per minute per IP
- Configurable via backend settings

## Browser Support

The widget supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

**Widget not loading:**
- Check that CSS and JS files are accessible
- Verify file paths are correct
- Check browser console for errors

**Form not submitting:**
- Verify API endpoint is accessible
- Check API key is correct
- Ensure CORS is configured on backend

**Styling issues:**
- Check CSS file is loading
- Verify no CSS conflicts with your site
- Test in different browsers

### Debug Mode

Enable debug logging by adding this before the widget script:

```html
<script>
  window.GMBookingWidgetConfig = {
    debug: true
  };
</script>
```

## Customization

### CSS Customization

You can override widget styles by adding CSS after the widget CSS:

```css
/* Custom button color */
.gm-booking-widget .submit-button {
  background: #your-color !important;
}

/* Custom form styling */
.gm-booking-widget .form-input {
  border-color: #your-color !important;
}
```

### Event Handling

Listen for widget events:

```javascript
// Success event
document.addEventListener('gm-booking-success', function(event) {
  console.log('Booking created:', event.detail.bookingId);
});

// Error event
document.addEventListener('gm-booking-error', function(event) {
  console.log('Booking failed:', event.detail.error);
});
```

## Support

For technical support or feature requests, contact the GM Dashboard team.

---

**Version:** 1.0.0  
**Last Updated:** January 2024 