import { NextRequest, NextResponse } from 'next/server';
import exactMap from './redirect-map.json';
import wildcardMap from './wildcard-map.json';

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, '');
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = normalizePath(url.pathname);

  // Skip redirect processing for Next.js internals and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Don't skip files with extensions - we want to process .html files
  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return NextResponse.next();
  }

  /* 1️⃣ Exact match */
  const exact = (exactMap as Record<string, string>)[pathname];

  if (exact && exact !== pathname) {
    const normalizedExact = normalizePath(exact);
    // Double-check to prevent identical redirects
    if (normalizedExact !== pathname) {
      return NextResponse.redirect(
        new URL(exact, url.origin),
        301
      );
    }
  }

  /* 2️⃣ .html stripping */
  if (pathname.endsWith('.html')) {
    const stripped = pathname.replace(/\.html$/, '');
    const htmlMatch =
      (exactMap as Record<string, string>)[stripped];

    if (htmlMatch && htmlMatch !== pathname) {
      const normalizedHtmlMatch = normalizePath(htmlMatch);
      // Prevent redirect loops
      if (normalizedHtmlMatch !== pathname && normalizedHtmlMatch !== stripped) {
        return NextResponse.redirect(
          new URL(htmlMatch, url.origin),
          301
        );
      }
    }
  }

  /* 3️⃣ Wildcard match */
  for (const base in wildcardMap as Record<string, string>) {
    if (pathname.startsWith(base)) {
      const destination =
        (wildcardMap as Record<string, string>)[base];

      if (destination && destination !== pathname) {
        const normalizedDestination = normalizePath(destination);
        // Prevent redirect loops
        if (normalizedDestination !== pathname) {
          return NextResponse.redirect(
            new URL(destination, url.origin),
            301
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};