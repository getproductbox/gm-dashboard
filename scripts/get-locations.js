#!/usr/bin/env node

import { Client as SquareClient } from 'squareup';

const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'production';

if (!squareAccessToken) {
  console.error('Missing SQUARE_ACCESS_TOKEN environment variable');
  process.exit(1);
}

const squareClient = new SquareClient({
  accessToken: squareAccessToken,
  environment: squareEnvironment === 'production' ? 'production' : 'sandbox'
});

async function getLocations() {
  try {
    console.log(`Fetching locations from Square (${squareEnvironment})...`);
    
    const response = await squareClient.locationsApi.listLocations();
    
    if (response.result && response.result.locations) {
      console.log('\nYour Square Locations:');
      console.log('='.repeat(50));
      
      response.result.locations.forEach((location, index) => {
        console.log(`${index + 1}. ${location.name}`);
        console.log(`   ID: ${location.id}`);
        console.log(`   Status: ${location.status}`);
        console.log(`   Address: ${location.address ? 
          `${location.address.address_line_1 || ''} ${location.address.locality || ''}`.trim() : 'N/A'}`);
        console.log(`   Currency: ${location.currency || 'USD'}`);
        console.log('');
      });
      
      console.log('Use these Location IDs in your VENUE_MAPPING in the backfill script.');
      
    } else {
      console.log('No locations found.');
    }
    
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    
    if (error.message.includes('401')) {
      console.error('\nThis looks like an authentication error. Please check:');
      console.error('1. Your SQUARE_ACCESS_TOKEN is correct');
      console.error('2. Your SQUARE_ENVIRONMENT is set correctly (production/sandbox)');
      console.error('3. Your token has the necessary permissions');
    }
  }
}

getLocations();