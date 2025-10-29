'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {doc, setDoc, getDocs, query, where, collection} from 'firebase/firestore';
import {useAuth, useFirestore} from '@/firebase';
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
      return 'Username ini sudah terdaftar. Silakan gunakan username lain.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/invalid-email':
      return 'Format username tidak valid. Hanya gunakan huruf, angka, dan underscore.';
    default:
      return 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const {toast} = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isUsernameTaken = async (username: string) => {
    if (!firestore) return false;
    const q = query(collection(firestore, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      toast({
        title: 'Registrasi Gagal',
        description: 'Semua field harus diisi.',
        variant: 'destructive',
      });
      return;
    }
    
    if (username.includes('@')) {
      toast({
        title: 'Registrasi Gagal',
        description: 'Username tidak boleh mengandung simbol "@".',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    if (!auth || !firestore) return;

    const usernameExists = await isUsernameTaken(username);
    if (usernameExists) {
        toast({
            title: 'Registrasi Gagal',
            description: 'Username ini sudah terdaftar. Silakan gunakan username lain.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    // Create a dummy email for Firebase Auth from the username
    const email = `${username.toLowerCase()}@schediku.app`;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {displayName: name});

      // Create user profile in Firestore with username
      await setDoc(doc(firestore, 'users', user.uid), {
        displayName: name,
        username: username,
        createdAt: new Date().toISOString(),
      });

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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username_anda"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
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
