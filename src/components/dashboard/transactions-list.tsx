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
import { id } from 'date-fns/locale';

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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaksi Terkini</CardTitle>
          <CardDescription>
            Pengeluaran terbaru yang Anda catat.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
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
                            <p className="text-sm text-muted-foreground">{transaction.categoryName} &middot; {format(new Date(transaction.date), "d MMM", { locale: id })}</p>
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
            <p>Belum ada transaksi.</p>
            <p className="text-sm">Klik "Tambah Pengeluaran" untuk memulai.</p>
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
        title: "Informasi Kurang",
        description: "Harap isi semua kolom sebelum analisis.",
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
            title: "Analisis Gagal",
            description: result.error || "Tidak dapat menganalisis transaksi.",
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
        title: "Pengeluaran Ditambahkan",
        description: "Transaksi Anda telah dicatat.",
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
        <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
        <DialogDescription>
          Catat transaksi baru dan lihat dampaknya pada anggaran Anda.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="cth: Kopi bersama teman"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="cth: 25000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select onValueChange={setCategoryId} value={categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
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
          Batal
        </Button>
        <Button onClick={handleAnalysis} disabled={isLoading}>
          {isLoading ? 'Menganalisis...' : 'Analisis Pengeluaran'}
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
                        Hasil Analisis AI
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {analysisResult.analysisResult}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAnalysisResult(null)}>Tutup</AlertDialogCancel>
                    {analysisResult.canAddTransaction && 
                        <AlertDialogAction onClick={handleConfirmAdd}>
                            Tambah Pengeluaran
                        </AlertDialogAction>
                    }
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </DialogContent>
  );
}
