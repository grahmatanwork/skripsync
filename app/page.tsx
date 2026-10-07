import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Tracker from './tracker';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect('/login');
  return <Tracker />;
}
