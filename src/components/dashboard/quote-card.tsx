'use client';

import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {Lightbulb} from 'lucide-react';

type QuoteCardProps = {
  quote: string;
  loading: boolean;
};

export default function QuoteCard({quote, loading}: QuoteCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full">
            <Lightbulb className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
          </div>
          {loading ? (
            <Skeleton className="h-5 w-3/4" />
          ) : (
            <p className="text-sm italic text-muted-foreground">
              &ldquo;{quote}&rdquo;
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
