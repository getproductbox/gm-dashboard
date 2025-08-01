# Widget Team Instructions: Updating to Dynamic APIs

## Overview

The widget currently uses hardcoded data. We've created new API endpoints that provide dynamic data from the database. This document provides step-by-step instructions for updating the widget to use these APIs.

## Current Widget Status

The widget is currently deployed at `booking-widget.getproductbox.com` and uses hardcoded data for:
- Venue configurations
- Time slots
- Pricing calculations
- Karaoke booth information

## New API Endpoints Available

1. **venue-config-api** - Dynamic venue and area data
2. **karaoke-booths-api** - Real karaoke booth data from database
3. **timeslots-api** - Available time slots based on existing bookings
4. **pricing-api** - Dynamic pricing calculations

## Required Changes

### 1. Replace Hardcoded Venue Data

**Current:** Widget has hardcoded venue data
**New:** Fetch from `venue-config-api`

```javascript
// OLD: Hardcoded data
const venues = [
  { id: 'manor', name: 'The Manor', areas: [...] }
];

// NEW: Dynamic API call
async function loadVenues() {
  try {
    const response = await fetch('https://your-project.supabase.co/functions/v1/venue-config-api', {
      headers: {
        'x-api-key': 'your-service-role-key'
      }
    });
    const data = await response.json();
    return data.venues;
  } catch (error) {
    console.error('Error loading venues:', error);
    return []; // Fallback to empty array
  }
}
```

### 2. Replace Hardcoded Time Slots

**Current:** Widget has hardcoded time slots
**New:** Fetch from `timeslots-api`

```javascript
// OLD: Hardcoded time slots
const timeSlots = ['10:00', '10:30', '11:00', ...];

// NEW: Dynamic API call
async function loadTimeSlots(date, venue, venueArea) {
  try {
    const params = new URLSearchParams({
      date: date,
      venue: venue,
      venue_area: venueArea
    });
    
    const response = await fetch(`https://your-project.supabase.co/functions/v1/timeslots-api?${params}`, {
      headers: {
        'x-api-key': 'your-service-role-key'
      }
    });
    const data = await response.json();
    return data.time_slots.filter(slot => slot.available);
  } catch (error) {
    console.error('Error loading time slots:', error);
    return []; // Fallback to empty array
  }
}
```

### 3. Replace Hardcoded Pricing

**Current:** Widget has hardcoded pricing logic
**New:** Fetch from `pricing-api`

```javascript
// OLD: Hardcoded pricing calculation
function calculatePrice(venue, area, guests, duration) {
  // Hardcoded logic
}

// NEW: Dynamic API call
async function calculatePricing(venue, venueArea, date, guests, duration) {
  try {
    const params = new URLSearchParams({
      venue: venue,
      venue_area: venueArea,
      date: date,
      guests: guests.toString(),
      duration: duration.toString()
    });
    
    const response = await fetch(`https://your-project.supabase.co/functions/v1/pricing-api?${params}`, {
      headers: {
        'x-api-key': 'your-service-role-key'
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return null; // Fallback to null
  }
}
```

### 4. Replace Hardcoded Karaoke Data

**Current:** Widget has hardcoded karaoke booth data
**New:** Fetch from `karaoke-booths-api`

```javascript
// OLD: Hardcoded karaoke booths
const karaokeBooths = [
  { id: 1, name: 'Booth A', capacity: 6 }
];

// NEW: Dynamic API call
async function loadKaraokeBooths(venue) {
  try {
    const params = new URLSearchParams({
      venue: venue,
      available: 'true'
    });
    
    const response = await fetch(`https://your-project.supabase.co/functions/v1/karaoke-booths-api?${params}`, {
      headers: {
        'x-api-key': 'your-service-role-key'
      }
    });
    const data = await response.json();
    return data.booths;
  } catch (error) {
    console.error('Error loading karaoke booths:', error);
    return []; // Fallback to empty array
  }
}
```

## Implementation Steps

### Step 1: Get API Credentials
You'll need the Supabase service role key to authenticate API calls. Contact the GM Dashboard team for this.

### Step 2: Update Widget Initialization
Modify the widget initialization to load dynamic data:

```javascript
// In your widget initialization
async function initializeWidget() {
  try {
    // Load venues dynamically
    const venues = await loadVenues();
    populateVenueDropdowns(venues);
    
    // Set up event listeners for dynamic data loading
    setupEventListeners();
  } catch (error) {
    console.error('Widget initialization failed:', error);
    // Fallback to hardcoded data
    useFallbackData();
  }
}
```

### Step 3: Add Loading States
Add loading indicators while fetching data:

```javascript
function showLoading(element) {
  element.innerHTML = '<div class="loading">Loading...</div>';
}

function hideLoading(element) {
  // Remove loading indicator
}
```

### Step 4: Add Error Handling
Implement graceful error handling:

```javascript
async function safeApiCall(apiFunction, fallbackData) {
  try {
    const result = await apiFunction();
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    return fallbackData; // Return fallback data
  }
}

// Usage
const venues = await safeApiCall(loadVenues, defaultVenues);
```

### Step 5: Update Event Handlers
Modify event handlers to use dynamic data:

```javascript
// When venue changes, load areas and time slots
function onVenueChange(venue) {
  const venueData = venues.find(v => v.id === venue);
  if (venueData) {
    populateAreaDropdowns(venueData.areas);
    loadTimeSlotsForVenue(venue);
  }
}

// When date changes, load available time slots
async function onDateChange(date, venue, venueArea) {
  showLoading(timeSlotContainer);
  const timeSlots = await loadTimeSlots(date, venue, venueArea);
  populateTimeSlots(timeSlots);
  hideLoading(timeSlotContainer);
}

// When options change, calculate pricing
async function onOptionsChange() {
  const pricing = await calculatePricing(venue, venueArea, date, guests, duration);
  if (pricing) {
    displayPricing(pricing);
  }
}
```

## Testing Checklist

- [ ] Test venue loading from API
- [ ] Test time slot loading for different dates
- [ ] Test pricing calculation with various parameters
- [ ] Test karaoke booth loading
- [ ] Test error handling when APIs fail
- [ ] Test fallback to hardcoded data
- [ ] Test loading states
- [ ] Test on different marketing sites

## API Endpoints Summary

| Endpoint | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `venue-config-api` | Get venue configurations | `venue` (optional) | Venue data with areas |
| `timeslots-api` | Get available time slots | `date` (required), `venue`, `venue_area` | Available time slots |
| `pricing-api` | Calculate pricing | `venue`, `venue_area`, `date`, `guests`, `duration` | Pricing breakdown |
| `karaoke-booths-api` | Get karaoke booths | `venue`, `available` | Available booths |

## Error Handling Best Practices

1. **Always provide fallbacks** - If API fails, use hardcoded data
2. **Show loading states** - Let users know data is being fetched
3. **Log errors** - For debugging purposes
4. **Graceful degradation** - Widget should still work even if some APIs fail

## Performance Considerations

1. **Cache venue data** - Venue configurations don't change often
2. **Cache time slots** - Cache for a few minutes to avoid excessive calls
3. **Implement debouncing** - Don't make API calls on every keystroke
4. **Use loading states** - Prevent multiple simultaneous calls

## Contact Information

For API credentials or technical questions, contact the GM Dashboard team.

## Next Steps

1. Get API credentials from GM Dashboard team
2. Update widget code to use dynamic APIs
3. Test thoroughly on staging environment
4. Deploy updated widget
5. Monitor API usage and performance 