'use client';

import {Card, CardContent} from '@/components/ui/card';
import {Lightbulb} from 'lucide-react';

type QuoteCardProps = {
  quote: string;
};

export default function QuoteCard({quote}: QuoteCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full">
            <Lightbulb className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
          </div>
          <p className="text-sm italic text-muted-foreground">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
