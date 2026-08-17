import { NextResponse } from 'next/server';

// Route handlers are statically optimized by default; a health probe must
// always reflect the live process.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
