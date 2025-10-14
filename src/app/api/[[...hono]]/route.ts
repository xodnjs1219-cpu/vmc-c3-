import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createHonoApp } from '@/backend/hono/app';

const baseApp = createHonoApp();
const app = new Hono().route('/api', baseApp);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

export const runtime = 'nodejs';
