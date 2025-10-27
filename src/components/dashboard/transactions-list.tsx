'use client';

import {useState} from 'react';
import type {Category, Transaction} from '@/lib/types';
import {checkTransactionCapacity} from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Plus, AlertTriangle, CheckCircle2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {format} from 'date-fns';

type TransactionsListProps = {
  transactions: Transaction[];
  categories: Category[];
  monthlyBudget: number;
  categoryBudgetAllocation: Record<string, number>;
  currentSpendingByCategory: Record<string, number>;
  onAddTransaction: (
    amount: number,
    categoryId: string,
    description: string
  ) => void;
};

export default function TransactionsList({
  transactions,
  categories,
  onAddTransaction,
  monthlyBudget,
  categoryBudgetAllocation,
  currentSpendingByCategory,
}: TransactionsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest recorded expenses.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <AddTransactionDialog
            categories={categories}
            onAddTransaction={onAddTransaction}
            setIsOpen={setIsAddDialogOpen}
            monthlyBudget={monthlyBudget}
            categoryBudgetAllocation={categoryBudgetAllocation}
            currentSpendingByCategory={currentSpendingByCategory}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 5).map(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const Icon = category?.icon;
                return (
                    <div key={transaction.id} className="flex items-center gap-4">
                         {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
                        <div className="flex-grow">
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{transaction.categoryName} &middot; {format(new Date(transaction.date), "MMM d")}</p>
                        </div>
                        <div className="font-medium text-right">
                           - {formatCurrency(transaction.amount)}
                        </div>
                    </div>
                )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No transactions yet.</p>
            <p className="text-sm">Click "Add Expense" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddTransactionDialog({
  categories,
  onAddTransaction,
  setIsOpen,
  monthlyBudget,
  categoryBudgetAllocation,
  currentSpendingByCategory,
}: {
  categories: Category[];
  onAddTransaction: (
    amount: number,
    categoryId: string,
    description: string
  ) => void;
  setIsOpen: (open: boolean) => void;
  monthlyBudget: number;
  categoryBudgetAllocation: Record<string, number>;
  currentSpendingByCategory: Record<string, number>;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ canAddTransaction: boolean; analysisResult: string } | null>(null);

  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!amount || !categoryId || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields before analysis.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);

    const selectedCategory = categories.find(c => c.id === categoryId);
    if (!selectedCategory) return;
    
    const input = {
        transactionAmount: parseFloat(amount),
        transactionCategory: selectedCategory.name,
        monthlyBudget,
        categoryBudgetAllocation,
        currentSpendingByCategory
    }

    const result = await checkTransactionCapacity(input);
    
    if (result.success && result.data) {
        setAnalysisResult(result.data);
    } else {
        toast({
            title: "Analysis Failed",
            description: result.error || "Could not analyze the transaction.",
            variant: "destructive",
        })
    }
    setIsLoading(false);
  };

  const handleConfirmAdd = () => {
    onAddTransaction(parseFloat(amount), categoryId, description);
    setIsOpen(false);
    resetForm();
    toast({
        title: "Expense Added",
        description: "Your transaction has been recorded.",
    });
  }
  
  const resetForm = () => {
      setDescription('');
      setAmount('');
      setCategoryId('');
      setAnalysisResult(null);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogDescription>
          Record a new transaction and see how it impacts your budget.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Coffee with a friend"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g., 5.50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={setCategoryId} value={categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={handleAnalysis} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze Expense'}
        </Button>
      </DialogFooter>

      {analysisResult && (
        <AlertDialog open={!!analysisResult} onOpenChange={() => setAnalysisResult(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {analysisResult.canAddTransaction ? 
                        <CheckCircle2 className="h-6 w-6 text-green-500" /> : 
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                        AI Analysis Result
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {analysisResult.analysisResult}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAnalysisResult(null)}>Close</AlertDialogCancel>
                    {analysisResult.canAddTransaction && 
                        <AlertDialogAction onClick={handleConfirmAdd}>
                            Add Expense
                        </AlertDialogAction>
                    }
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </DialogContent>
  );
}
