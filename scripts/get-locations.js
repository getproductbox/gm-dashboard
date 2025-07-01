#!/usr/bin/env node

const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'production';

// Square API base URL
const SQUARE_BASE_URL = squareEnvironment === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

if (!squareAccessToken) {
  console.error('Missing SQUARE_ACCESS_TOKEN environment variable');
  process.exit(1);
}

async function makeSquareRequest(endpoint) {
  const url = `${SQUARE_BASE_URL}/v2${endpoint}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${squareAccessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-06-04'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Square API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

async function getLocations() {
  try {
    console.log(`Fetching locations from Square (${squareEnvironment})...`);
    
    const response = await makeSquareRequest('/locations');
    
    if (response.locations && response.locations.length > 0) {
      console.log('\nYour Square Locations:');
      console.log('='.repeat(50));
      
      response.locations.forEach((location, index) => {
        console.log(`${index + 1}. ${location.name}`);
        console.log(`   ID: ${location.id}`);
        console.log(`   Status: ${location.status}`);
        console.log(`   Address: ${location.address ? 
          `${location.address.address_line_1 || ''} ${location.address.locality || ''}`.trim() : 'N/A'}`);
        console.log(`   Currency: ${location.currency || 'USD'}`);
        console.log('');
      });
      
      console.log('='.repeat(50));
      console.log('COPY THESE FOR YOUR BACKFILL SCRIPT:');
      console.log('='.repeat(50));
      console.log('Replace the VENUE_MAPPING in square-backfill.mjs with:');
      console.log('');
      console.log('const VENUE_MAPPING = {');
      response.locations.forEach(location => {
        const venueName = location.name.toLowerCase().includes('manor') ? 'manor' : 
                         location.name.toLowerCase().includes('hippie') ? 'hippie' : 
                         'manor'; // default to manor
        console.log(`  '${location.id}': '${venueName}',`);
      });
      console.log('};');
      
    } else {
      console.log('No locations found.');
    }
    
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\nThis looks like an authentication error. Please check:');
      console.error('1. Your SQUARE_ACCESS_TOKEN is correct');
      console.error('2. Your SQUARE_ENVIRONMENT is set correctly (production/sandbox)');
      console.error('3. Your token has the necessary permissions');
    }
  }
}

getLocations();