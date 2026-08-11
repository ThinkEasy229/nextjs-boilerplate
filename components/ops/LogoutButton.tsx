'use client';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('thinkeasy.session');
    window.location.assign('/');
  }

  return (
    <button
      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
      onClick={() => {
        void handleLogout();
      }}
      type="button"
    >
      Logout
    </button>
  );
}
