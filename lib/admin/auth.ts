import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side admin guard.
 * Checks that the current user's email is in the ADMIN_EMAILS env var.
 * Redirects to /login if not authenticated or not an admin.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user || !adminEmails.includes((user.email ?? '').toLowerCase())) {
    redirect('/login?next=/admin');
  }

  return user;
}
