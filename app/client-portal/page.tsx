import { cookies } from 'next/headers';
import ClientPortalGate from '@/components/ops/ClientPortalGate';
import ClientPortalDashboard from '@/components/ops/ClientPortalDashboard';

export const dynamic = 'force-dynamic';

const CLIENT_PORTAL_COOKIE = 'thinkeasy_client_portal';

export default async function ClientPortalPage() {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get(CLIENT_PORTAL_COOKIE)?.value === '1';

  if (!isAuthorized) {
    return <ClientPortalGate />;
  }

  return <ClientPortalDashboard />;
}
