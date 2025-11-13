import { app } from '../../apps/api/src/app';

// Netlify Functions entrypoint – manually handle Netlify event format
export const handler = async (event: any, context: any) => {
  try {
    // Log event structure for debugging (remove in production if needed)
    console.log('Netlify event:', JSON.stringify({
      path: event.path,
      rawPath: event.rawPath,
      httpMethod: event.httpMethod,
      headers: Object.keys(event.headers || {}),
    }, null, 2));

    // Netlify Functions: event.path contains the path AFTER the function name
    // So /.netlify/functions/api/xero/pnl becomes /xero/pnl in event.path
    // But we need to check both path and rawPath as Netlify versions differ
    let path = event.path || event.rawPath || '/';
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    const host = event.headers?.['host'] || event.headers?.['Host'] || 'localhost';
    const protocol = event.headers?.['x-forwarded-proto'] || 'https';
    
    // Handle query string
    const queryString = event.rawQuery || (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '');
    
    // Construct full URL - path already has /xero/pnl, no need to add /api
    const url = `${protocol}://${host}${path}${queryString}`;
    
    console.log('Constructed URL:', url);
    console.log('Request path:', path);

    // Construct a proper Request object for Hono
    const request = new Request(url, {
      method: event.httpMethod || event.requestContext?.http?.method || 'GET',
      headers: new Headers(event.headers as Record<string, string> || {}),
      body: event.body && event.body !== '' ? event.body : undefined,
    });

    // Call Hono app with the request
    const response = await app.fetch(request);
    
    console.log('Hono response status:', response.status);
    
    // Convert Response to Netlify format
    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: response.status,
      headers,
      body,
    };
  } catch (error: any) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error', stack: error.stack }),
    };
  }
};


