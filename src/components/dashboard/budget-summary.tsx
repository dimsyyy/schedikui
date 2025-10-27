'use client';

import {useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Pencil } from 'lucide-react';
import { Progress } from '../ui/progress';

type BudgetSummaryProps = {
  monthlyBudget: number;
  totalSpent: number;
  totalBudgeted: number;
  onSetBudget: (amount: number) => void;
};

export default function BudgetSummary({
  monthlyBudget,
  totalSpent,
  totalBudgeted,
  onSetBudget,
}: BudgetSummaryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());

  const remainingBudget = monthlyBudget - totalSpent;
  const spendingProgress = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const handleSave = () => {
    const amount = parseFloat(newBudget);
    if(!isNaN(amount)) {
      onSetBudget(amount);
    }
    setIsDialogOpen(false);
  }

  return (
    <>
      <Card className="sm:col-span-2">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Monthly Overview</CardTitle>
           <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}>
             <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{formatCurrency(monthlyBudget)}</div>
          <CardDescription>Your total monthly budget.</CardDescription>
        </CardContent>
        <CardFooter>
            <div className="w-full">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Spent: {formatCurrency(totalSpent)}</span>
                    <span>Remaining: {formatCurrency(remainingBudget)}</span>
                </div>
                <Progress value={spendingProgress} aria-label={`${spendingProgress.toFixed(0)}% of budget spent`} />
            </div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Spent</CardDescription>
          <CardTitle className="text-3xl">{formatCurrency(totalSpent)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(totalBudgeted)} allocated across categories
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Remaining Budget</CardDescription>
          <CardTitle className={`text-3xl ${remainingBudget < 0 ? 'text-destructive' : 'text-accent-foreground'}`}>
            {formatCurrency(remainingBudget)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-xs ${remainingBudget < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {remainingBudget < 0 ? 'You are over budget' : 'You are on track'}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Monthly Budget</DialogTitle>
            <DialogDescription>
              Enter your total income or the amount you want to budget for this month.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget" className="text-right">
                Budget
              </Label>
              <Input
                id="budget"
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 3000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
