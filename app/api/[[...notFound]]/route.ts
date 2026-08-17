import { apiError } from '@/lib/apiResponse';

// JSON 404 for unmatched /api/* paths.
//
// Measured behavior (Next.js 14.2 + Clerk v4 middleware, verified locally):
//   - unauthenticated request to any /api/* path -> middleware short-circuits
//     with a JSON 401 before routing, unknown paths included;
//   - authenticated request to an unknown /api/* path -> Next.js renders its
//     HTML not-found page.
// This optional catch-all is the simplest reliable fix for the second case:
// concrete routes (/api/health, /api/publish) take routing precedence, and
// everything else under /api/* gets a JSON 404 for every method.
function notFound() {
  return apiError(404, 'Not found');
}

export {
  notFound as GET,
  notFound as POST,
  notFound as PUT,
  notFound as PATCH,
  notFound as DELETE,
  notFound as HEAD,
  notFound as OPTIONS,
};
