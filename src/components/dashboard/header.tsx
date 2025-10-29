'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {signOut, deleteUser} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {useAuth, useUser, useFirestore} from '@/firebase';
import {Icons} from '@/components/icons';
import {ThemeToggle} from '@/components/theme-toggle';
import {Button} from '../ui/button';
import {LogOut, Trash2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {cn} from '@/lib/utils';
import type {UserProfile, Budget} from '@/lib/types';

export default function Header() {
  const auth = useAuth();
  const firestore = useFirestore();
  const {user} = useUser();
  const router = useRouter();
  const {toast} = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      }
    };
    fetchUserProfile();
  }, [user, firestore]);

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

  const handleDeleteAccount = async () => {
    if (!user || !firestore || !auth) return;

    setIsDeleting(true);
    try {
      // 1. Delete all user data from Firestore
      const batch = writeBatch(firestore);

      // Find all budgets for the user
      const budgetsQuery = query(
        collection(firestore, 'budgets'),
        where('userId', '==', user.uid)
      );
      const budgetsSnapshot = await getDocs(budgetsQuery);

      for (const budgetDoc of budgetsSnapshot.docs) {
        const budgetId = budgetDoc.id;

        // Delete categories subcollection
        const categoriesRef = collection(
          firestore,
          'budgets',
          budgetId,
          'categories'
        );
        const categoriesSnapshot = await getDocs(categoriesRef);
        categoriesSnapshot.forEach(doc => batch.delete(doc.ref));

        // Delete transactions subcollection
        const transactionsRef = collection(
          firestore,
          'budgets',
          budgetId,
          'transactions'
        );
        const transactionsSnapshot = await getDocs(transactionsRef);
        transactionsSnapshot.forEach(doc => batch.delete(doc.ref));

        // Delete the budget document itself
        batch.delete(budgetDoc.ref);
      }

      // Delete the user profile document
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.delete(userDocRef);

      // Commit all deletions
      await batch.commit();

      // 2. Delete the user from Firebase Auth
      await deleteUser(user);

      toast({
        title: 'Akun Dihapus',
        description: 'Akun Anda dan semua data terkait telah dihapus.',
      });

      router.push('/register');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      // Handle re-authentication if needed
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Gagal Menghapus Akun',
          description:
            'Operasi ini memerlukan login ulang. Silakan logout, login kembali, dan coba lagi.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Menghapus Akun',
          description: error.message || 'Terjadi kesalahan yang tidak diketahui.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 shadow-sm backdrop-blur sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:shadow-none">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Icons.Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Schediku
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src={user.photoURL || ''}
                      alt={user.displayName || ''}
                    />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.displayName || user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Hapus Akun</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin menghapus akun?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun
                  Anda dan semua data terkait dari server kami secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </header>
  );
}
