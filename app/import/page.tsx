import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ImportForm from './import-form';

export default async function ImportPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect('/login');
  return <main className="import-screen"><section className="import-card"><p className="eyebrow">SKRIPSYNC</p><h1>Pindahkan progres lama</h1><p>Impor file JSON dari Skripsync versi GPT Site. Data ini hanya bisa dimasukkan ke akun Google yang sedang kamu pakai.</p><ImportForm /><a href="/">Kembali ke dashboard</a></section></main>;
}
