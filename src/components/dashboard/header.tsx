'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {signOut} from 'firebase/auth';
import {useAuth} from '@/firebase';
import {Icons} from '@/components/icons';
import {ThemeToggle} from '@/components/theme-toggle';
import {Button} from '../ui/button';
import {LogOut} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

export default function Header() {
  const auth = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari akun Anda.',
      });
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Icons.Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Schediku</h1>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
