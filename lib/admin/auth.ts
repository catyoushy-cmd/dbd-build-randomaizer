import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side admin guard.
 *
 * Auth mode is controlled by the ADMIN_EMAILS env var:
 *   - Not set / empty → guard disabled (open access, for local dev/testing)
 *   - Set to comma-separated emails → only those users can access /admin
 *
 * To re-enable: add ADMIN_EMAILS=your@email.com to .env.local
 */
export async function requireAdmin() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Guard disabled — ADMIN_EMAILS not configured
  if (adminEmails.length === 0) {
    return null;
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !adminEmails.includes((user.email ?? '').toLowerCase())) {
    redirect('/login?next=/admin');
  }

  return user;
}
