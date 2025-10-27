import type {LucideIcon} from 'lucide-react';

export type Category = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: React.ComponentType<{ className?: string }>;
};

export type Transaction = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  date: string;
};

export type DefaultCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
}
