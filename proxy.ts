import { clerkMiddleware } from '@clerk/nextjs/server';

function normalizeClerkEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unwrapped = trimmed.slice(1, -1).trim();
    return unwrapped || undefined;
  }

  return trimmed || undefined;
}

const publishableKey = normalizeClerkEnv(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY
);
const secretKey = normalizeClerkEnv(process.env.CLERK_SECRET_KEY);

export default clerkMiddleware({
  publishableKey,
  secretKey,
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
