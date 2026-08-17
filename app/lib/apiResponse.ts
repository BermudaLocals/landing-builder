import { NextResponse } from 'next/server';

// JSON contract for every /api/* route:
//   success: HTTP 2xx with { success: true, ...payload }
//   error:   HTTP 4xx/5xx with { success: false, error: string }
// Keep both shapes flat so existing clients can read fields directly
// (e.g. the builder reads `data.url` from /api/publish).
export function apiOk<T extends Record<string, unknown>>(payload: T, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status });
}

export function apiError(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}
