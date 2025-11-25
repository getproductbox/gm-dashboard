// Simple test function to verify Netlify Functions are working
export const handler = async (event: any, context: any) => {
  console.log('Test function invoked!', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'Test function works!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    }),
  };
};




