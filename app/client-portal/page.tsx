import { cookies } from 'next/headers';
import ClientPortalGate from '@/components/ops/ClientPortalGate';
import ClientPortalDashboard from '@/components/ops/ClientPortalDashboard';
import { CLIENT_PORTAL_COOKIE, verifyPortalToken } from '@/lib/client-portal-session';

export const dynamic = 'force-dynamic';

export default async function ClientPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_PORTAL_COOKIE)?.value;
  const isAuthorized = verifyPortalToken(token);

  if (!isAuthorized) {
    return <ClientPortalGate />;
  }

  return <ClientPortalDashboard />;
}
