import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (the
// exported function is now named `proxy` instead of `middleware`). next-intl
// still exposes its request handler via `createMiddleware`, but the returned
// function is a plain (request) => response handler, so it works unchanged
// under the new file/export name.
const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes, Next internals, and files with an extension (static assets)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
