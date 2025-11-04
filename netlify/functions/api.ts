import { handle } from '@hono/netlify';
import { app } from '../../apps/api/src/app';

export const handler = handle(app);


