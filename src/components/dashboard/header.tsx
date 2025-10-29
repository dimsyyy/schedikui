'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {signOut} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import {useAuth, useUser, useFirestore} from '@/firebase';
import {Icons} from '@/components/icons';
import {ThemeToggle} from '@/components/theme-toggle';
import {Button} from '../ui/button';
import {LogOut} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {cn} from '@/lib/utils';

type UserProfile = {
  displayName: string;
  username?: string; // Make username optional
};

export default function Header() {
  const auth = useAuth();
  const firestore = useFirestore();
  const {user} = useUser();
  const router = useRouter();
  const {toast} = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getDisplayUsername = () => {
    if (userProfile?.username) {
      return userProfile.username;
    }
    if (user?.email) {
      // For old users, their email is not a dummy one
      if (!user.email.endsWith('@schediku.app')) {
        return user.email;
      }
      // For new users, derive username from dummy email
      return user.email.split('@')[0];
    }
    return 'user';
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 shadow-sm backdrop-blur sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:shadow-none">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Icons.Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Schediku</h1>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {user && (
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
                    @{getDisplayUsername()}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
