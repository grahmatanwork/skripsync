'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function GoogleLogin() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const login = async () => {
    setPending(true);
    setError('');
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError('Login belum berhasil. Coba lagi.'); setPending(false); }
  };
  return <><button className="google-login" onClick={login} disabled={pending}>Masuk dengan Google</button>{error && <p role="alert">{error}</p>}</>;
}
