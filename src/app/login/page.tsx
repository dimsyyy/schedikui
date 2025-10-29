'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {useAuth, useUser} from '@/firebase';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Icons} from '@/components/icons';
import {useToast} from '@/hooks/use-toast';

function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Username/Email atau password salah. Silakan coba lagi.';
    case 'auth/invalid-email':
      return 'Format username/email tidak valid.';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi nanti.';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const {user, loading: userLoading} = useUser();
  const {toast} = useToast();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!auth) return;

    let emailToLogin: string;

    // Check if the input is an email or a username
    if (loginInput.includes('@')) {
      // User is likely logging in with their old email
      emailToLogin = loginInput.toLowerCase();
    } else {
      // User is logging in with a username, construct the dummy email
      emailToLogin = `${loginInput.toLowerCase()}@schediku.app`;
    }

    try {
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      toast({
        title: 'Login Berhasil!',
        description: 'Anda akan diarahkan ke dashboard.',
      });
      router.push('/');
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      toast({
        title: 'Login Gagal',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <Link
            href="#"
            className="flex justify-center items-center gap-2 text-lg font-semibold md:text-base mb-4"
          >
            <Icons.Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Schediku</h1>
          </Link>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Masukkan username atau email Anda untuk login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login_input">Username atau Email</Label>
                <Input
                  id="login_input"
                  type="text"
                  placeholder="username atau email@anda.com"
                  required
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}