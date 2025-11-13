import { handle } from 'hono/netlify';
import { app } from '../../apps/api/src/app';

// Netlify Functions entrypoint – reuses the shared Hono app
export const handler = handle(app);


