'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {useAuth, useFirestore, useUser} from '@/firebase';
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
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan gunakan email lain.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    default:
      return 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const {user, loading: userLoading} = useUser();
  const {toast} = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({
        title: 'Registrasi Gagal',
        description: 'Semua field harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    if (!auth) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update Firebase Auth profile displayName
      await updateProfile(user, {displayName: name});

      // The user profile document will be created on the first visit to the dashboard page.

      toast({
        title: 'Registrasi Berhasil!',
        description:
          'Akun Anda telah dibuat. Anda akan diarahkan ke dashboard.',
      });

      router.push('/');
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      toast({
        title: 'Registrasi Gagal',
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
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <Link
              href="#"
              className="flex justify-center items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Icons.Logo className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Schediku</h1>
            </Link>
            <p className="text-sm text-muted-foreground px-4">Lacak pengeluaran & buat anggaran untuk kejelasan finansial</p>
          </div>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Masukkan informasi Anda untuk membuat akun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@anda.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Membuat Akun...' : 'Buat Akun'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
