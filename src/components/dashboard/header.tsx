import Link from 'next/link';
import {Icons} from '@/components/icons';
import {ThemeToggle} from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link
        href="#"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Icons.Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Schediku</h1>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
