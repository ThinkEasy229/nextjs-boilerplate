import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PortalPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4 bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Protected Portal</h1>
        <p className="text-slate-400 text-sm">
          You are signed in. This page is only visible to authenticated users.
        </p>
        <p className="text-cyan-400 text-xs mt-4 font-mono">User ID: {userId}</p>
      </div>
    </main>
  );
}
