import { createClient } from '@/lib/supabase/server';
import { demoTracker } from '@/lib/tracker';
import Tracker from './tracker';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const preview = !claims;
  return <Tracker preview={preview} initialSnapshot={preview?{data:demoTracker(),revision:0,updatedAt:new Date().toISOString()}:undefined}/>;
}
