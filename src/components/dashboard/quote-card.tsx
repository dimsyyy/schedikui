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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full">
            <Lightbulb className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
          </div>
          <p
            className={cn(
              'text-sm italic text-muted-foreground transition-opacity duration-500',
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
