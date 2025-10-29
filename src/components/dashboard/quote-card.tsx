'use client';

import {Card, CardContent} from '@/components/ui/card';
import {Lightbulb} from 'lucide-react';
import {cn} from '@/lib/utils';

type QuoteCardProps = {
  quote: string;
  isFading: boolean;
};

export default function QuoteCard({quote, isFading}: QuoteCardProps) {
  return (
    <Card className="bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-2 rounded-full">
            <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p
            className={cn(
              'text-sm italic text-amber-800/80 dark:text-amber-200/80 transition-opacity duration-500',
              isFading ? 'opacity-0' : 'opacity-100'
            )}
          >
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
