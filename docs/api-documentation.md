# GM Booking Widget API Documentation

## Overview

This document provides comprehensive documentation for the GM Booking Widget APIs. These APIs provide dynamic data to the widget, enabling real-time venue information, availability checking, and pricing calculations.

## Base URL

All APIs are hosted on Supabase Edge Functions:
```
https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/
```

## Authentication

All APIs require an API key in the `x-api-key` header:
```
x-api-key: demo-api-key-2024
```

## API Endpoints

### 1. Venue Configuration API

**Endpoint:** `GET /venue-config-api`

**Description:** Returns venue and area configurations with capacities, descriptions, and pricing information.

**Query Parameters:**
- `venue` (optional): Filter by specific venue (`manor` or `hippie`)

**Example Request:**
```javascript
const response = await fetch('https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/venue-config-api', {
  headers: {
    'x-api-key': 'demo-api-key-2024'
  }
});
```

**Example Response:**
```json
{
  "success": true,
  "venues": [
    {
      "id": "manor",
      "name": "Manor",
      "description": "Our flagship venue with multiple spaces for events",
      "operating_hours": {
        "start": "09:00",
        "end": "23:00"
      },
      "areas": [
        {
          "id": "upstairs",
          "name": "Upstairs",
          "capacity": 50,
          "description": "Elegant upstairs space perfect for intimate gatherings",
          "base_price": 500.00,
          "hourly_rate": 100.00
        },
        {
          "id": "downstairs",
          "name": "Downstairs",
          "capacity": 30,
          "description": "Cozy downstairs area with bar access",
          "base_price": 300.00,
          "hourly_rate": 75.00
        },
        {
          "id": "full_venue",
          "name": "Full Venue",
          "capacity": 80,
          "description": "Complete venue access including all areas",
          "base_price": 800.00,
          "hourly_rate": 150.00
        }
      ]
    }
  ]
}
```

### 2. Karaoke Booths API

**Endpoint:** `GET /karaoke-booths-api`

**Description:** Returns available karaoke booths with pricing and availability information.

**Query Parameters:**
- `venue` (optional): Filter by venue (`manor` or `hippie`)
- `available` (optional): Filter by availability (`true` or `false`)

**Example Request:**
```javascript
const response = await fetch('https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/karaoke-booths-api?venue=manor&available=true', {
  headers: {
    'x-api-key': 'demo-api-key-2024'
  }
});
```

**Example Response:**
```json
{
  "success": true,
  "booths": [
    {
      "id": "uuid",
      "name": "Karaoke Room A",
      "venue": "manor",
      "capacity": 8,
      "hourly_rate": 25.00,
      "is_available": true,
      "maintenance_notes": null,
      "operating_hours_start": "10:00",
      "operating_hours_end": "23:00"
    }
  ]
}
```

### 3. Time Slots API

**Endpoint:** `GET /timeslots-api`

**Description:** Returns available time slots for a specific date, considering existing bookings.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `venue` (optional): Filter by venue
- `venue_area` (optional): Filter by venue area

**Example Request:**
```javascript
const response = await fetch('https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/timeslots-api?date=2024-01-15&venue=manor&venue_area=upstairs', {
  headers: {
    'x-api-key': 'demo-api-key-2024'
  }
});
```

**Example Response:**
```json
{
  "success": true,
  "date": "2024-01-15",
  "venue": "manor",
  "venue_area": "upstairs",
  "operating_hours": {
    "start": "09:00",
    "end": "23:00"
  },
  "available_slots": [
    {
      "start": "09:00",
      "end": "09:30",
      "available": true
    },
    {
      "start": "09:30",
      "end": "10:00",
      "available": false,
      "conflicting_booking_id": "booking-uuid"
    }
  ]
}
```

### 4. Pricing API

**Endpoint:** `GET /pricing-api`

**Description:** Calculates pricing for venue bookings based on venue, area, date, and guest count.

**Query Parameters:**
- `venue` (required): Venue ID (`manor` or `hippie`)
- `venue_area` (required): Venue area (`upstairs`, `downstairs`, or `full_venue`)
- `date` (required): Date in YYYY-MM-DD format
- `guests` (required): Number of guests
- `duration` (optional): Duration in hours (default: 4)

**Example Request:**
```javascript
const response = await fetch('https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/pricing-api?venue=manor&venue_area=upstairs&date=2024-01-15&guests=20&duration=4', {
  headers: {
    'x-api-key': 'demo-api-key-2024'
  }
});
```

**Example Response:**
```json
{
  "success": true,
  "venue": "manor",
  "venue_area": "upstairs",
  "date": "2024-01-15",
  "guest_count": 20,
  "duration_hours": 4,
  "base_price": 500.00,
  "per_guest_surcharge": 25.00,
  "total_price": 975.00,
  "currency": "GBP",
  "includes": [
    "Basic setup",
    "Staff support",
    "Sound system"
  ],
  "addons": [
    {
      "id": "catering",
      "name": "Catering Service",
      "price": 200.00,
      "description": "Professional catering for your event"
    },
    {
      "id": "dj",
      "name": "DJ Service",
      "price": 150.00,
      "description": "Professional DJ for entertainment"
    }
  ]
}
```

## Widget Integration Guide

### Step 1: Load Venue Configuration

```javascript
// Load venue configuration on widget initialization
async function loadVenueConfig() {
  try {
    const response = await fetch('https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/venue-config-api', {
      headers: {
        'x-api-key': 'demo-api-key-2024'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Populate venue dropdowns
      populateVenueDropdowns(data.venues);
    }
  } catch (error) {
    console.error('Failed to load venue config:', error);
  }
}
```

### Step 2: Load Time Slots

```javascript
// Load available time slots for selected date
async function loadTimeSlots(date, venue, venueArea) {
  try {
    const url = `https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/timeslots-api?date=${date}&venue=${venue}&venue_area=${venueArea}`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': 'demo-api-key-2024'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Populate time slot dropdowns
      populateTimeSlots(data.available_slots);
    }
  } catch (error) {
    console.error('Failed to load time slots:', error);
  }
}
```

### Step 3: Calculate Pricing

```javascript
// Calculate pricing for selected options
async function calculatePricing(venue, venueArea, date, guests, duration = 4) {
  try {
    const url = `https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/pricing-api?venue=${venue}&venue_area=${venueArea}&date=${date}&guests=${guests}&duration=${duration}`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': 'demo-api-key-2024'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Display pricing information
      displayPricing(data);
    }
  } catch (error) {
    console.error('Failed to calculate pricing:', error);
  }
}
```

### Step 4: Load Karaoke Booths

```javascript
// Load karaoke booths for selected venue
async function loadKaraokeBooths(venue) {
  try {
    const url = `https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/karaoke-booths-api?venue=${venue}&available=true`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': 'demo-api-key-2024'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Populate karaoke booth dropdowns
      populateKaraokeBooths(data.booths);
    }
  } catch (error) {
    console.error('Failed to load karaoke booths:', error);
  }
}
```

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid API key)
- `405`: Method Not Allowed
- `500`: Internal Server Error

## Rate Limiting

APIs include basic rate limiting:
- Maximum 10 requests per minute per IP
- Returns 429 status code when limit exceeded

## CORS Support

All APIs support CORS for cross-origin requests from widget domains.

## Testing

You can test the APIs using curl:

```bash
# Test venue config API
curl -H "x-api-key: demo-api-key-2024" \
  "https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/venue-config-api"

# Test pricing API
curl -H "x-api-key: demo-api-key-2024" \
  "https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/pricing-api?venue=manor&venue_area=upstairs&date=2024-01-15&guests=20"
```

## Widget Implementation Checklist

- [ ] Load venue configuration on widget initialization
- [ ] Populate venue and area dropdowns dynamically
- [ ] Load time slots when date/venue/area changes
- [ ] Calculate and display pricing when options change
- [ ] Load karaoke booths for karaoke bookings
- [ ] Handle API errors gracefully
- [ ] Show loading states during API calls
- [ ] Validate guest counts against venue capacities
- [ ] Display operating hours and availability
- [ ] Show pricing breakdown and add-ons

## Next Steps

1. Deploy the new API endpoints to Supabase
2. Update the widget to use dynamic data instead of hardcoded values
3. Test all API integrations
4. Add real-time availability checking
5. Implement pricing display in the widget 