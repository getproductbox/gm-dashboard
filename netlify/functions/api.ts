import { app } from '../../apps/api/src/app';

// Netlify Functions entrypoint – manually handle Netlify event format
export const handler = async (event: any, context: any) => {
  try {
    // Netlify strips the function name from the path
    // So /.netlify/functions/api/xero/pnl becomes /xero/pnl in event.path
    const path = event.path || event.rawPath || '/';
    const host = event.headers?.['host'] || event.headers?.['Host'] || 'localhost';
    const protocol = event.headers?.['x-forwarded-proto'] || 'https';
    const queryString = event.rawQuery || (event.queryStringParameters 
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '');
    
    // Construct full URL - path already has /xero/pnl, no need to add /api
    const url = `${protocol}://${host}${path}${queryString}`;

    // Construct a proper Request object for Hono
    const request = new Request(url, {
      method: event.httpMethod || event.requestContext?.http?.method || 'GET',
      headers: new Headers(event.headers as Record<string, string> || {}),
      body: event.body && event.body !== '' ? event.body : undefined,
    });

    // Call Hono app with the request
    const response = await app.fetch(request);
    
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};


