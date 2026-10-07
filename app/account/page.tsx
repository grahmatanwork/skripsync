import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  return <main className="import-screen"><section className="import-card"><p className="eyebrow">AKUN SKRIPSYNC</p><h1>Akun dan data</h1><p>Masuk sebagai {user.email}. Data Skripsync tersimpan terpisah untuk setiap akun Google.</p><div className="account-links"><a href="/">Kembali ke dashboard</a><a href="/import">Impor progres lama</a><form action="/auth/signout" method="post"><button type="submit">Keluar</button></form></div></section></main>;
}
