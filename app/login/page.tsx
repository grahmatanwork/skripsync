import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GoogleLogin from './google-login';

export default async function Login() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (claims) redirect('/');
  return <main className="login-screen"><section className="login-card"><div className="login-emblem">S</div><p className="eyebrow">SKRIPSYNC</p><h1>Ruang skripsimu, satu tempat.</h1><p>Kelola tugas, bimbingan, kalender, dan arsip dengan akun Google milikmu.</p><GoogleLogin /></section></main>;
}
