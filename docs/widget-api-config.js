// GM Booking Widget API Configuration
// Copy this configuration into your widget code

const GM_BOOKING_API_CONFIG = {
  // Base URL for all API endpoints
  baseUrl: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/',
  
  // Service role key for authentication
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2NDkzMywiZXhwIjoyMDY2MzQwOTMzfQ.M4Ikh3gSAVTPDxkMNrXLFxCPjHYqaBC5HcVavpHpNlk',
  
  // API endpoints
  endpoints: {
    venueConfig: 'venue-config-api',
    karaokeBooths: 'karaoke-booths-api',
    timeSlots: 'timeslots-api',
    pricing: 'pricing-api'
  },
  
  // Helper function to make authenticated API calls
  async makeApiCall(endpoint, params = {}) {
    try {
      const url = new URL(this.baseUrl + endpoint);
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }
};

// Example usage functions for the widget team:

// 1. Load venue configurations
async function loadVenues(venue = null) {
  try {
    const params = venue ? { venue } : {};
    const data = await GM_BOOKING_API_CONFIG.makeApiCall(
      GM_BOOKING_API_CONFIG.endpoints.venueConfig, 
      params
    );
    return venue ? data.venue : data.venues;
  } catch (error) {
    console.error('Error loading venues:', error);
    return []; // Fallback to empty array
  }
}

// 2. Load available time slots
async function loadTimeSlots(date, venue = 'manor', venueArea = null) {
  try {
    const params = { date, venue };
    if (venueArea) params.venue_area = venueArea;
    
    const data = await GM_BOOKING_API_CONFIG.makeApiCall(
      GM_BOOKING_API_CONFIG.endpoints.timeSlots, 
      params
    );
    return data.time_slots.filter(slot => slot.available);
  } catch (error) {
    console.error('Error loading time slots:', error);
    return []; // Fallback to empty array
  }
}

// 3. Calculate pricing
async function calculatePricing(venue, venueArea, date, guests, duration) {
  try {
    const params = {
      venue,
      venue_area: venueArea,
      date,
      guests: guests.toString(),
      duration: duration.toString()
    };
    
    const data = await GM_BOOKING_API_CONFIG.makeApiCall(
      GM_BOOKING_API_CONFIG.endpoints.pricing, 
      params
    );
    return data;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return null; // Fallback to null
  }
}

// 4. Load karaoke booths
async function loadKaraokeBooths(venue = null, available = true) {
  try {
    const params = { available: available.toString() };
    if (venue) params.venue = venue;
    
    const data = await GM_BOOKING_API_CONFIG.makeApiCall(
      GM_BOOKING_API_CONFIG.endpoints.karaokeBooths, 
      params
    );
    return data.booths;
  } catch (error) {
    console.error('Error loading karaoke booths:', error);
    return []; // Fallback to empty array
  }
}

// Export for use in widget
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GM_BOOKING_API_CONFIG,
    loadVenues,
    loadTimeSlots,
    calculatePricing,
    loadKaraokeBooths
  };
} 