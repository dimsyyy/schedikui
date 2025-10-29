'use client';

import {useState} from 'react';
import type {Category, Transaction} from '@/lib/types';
import * as Lucide from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Plus, Sparkles, TrendingUp, TrendingDown} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {format} from 'date-fns';
import {id} from 'date-fns/locale';
import {RadioGroup, RadioGroupItem} from '../ui/radio-group';
import {cn} from '@/lib/utils';

type TransactionsListProps = {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onAddCategoryClick: () => void;
};

export default function TransactionsList({
  transactions,
  categories,
  onAddTransaction,
  onAddCategoryClick,
}: TransactionsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  // Sort transactions by date descending
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedTransactions = sortedTransactions.slice(0, visibleCount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryName = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return 'Pemasukan';
    }
    return categories.find(c => c.id === transaction.categoryId)?.name || 'N/A';
  };

  const getCategoryIcon = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return TrendingUp;
    }
    const category = categories.find(c => c.id === transaction.categoryId);
    return category ? Lucide[category.iconName] ?? Sparkles : Sparkles;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaksi Terkini</CardTitle>
          <CardDescription>
            Catatan pemasukan dan pengeluaran terbaru Anda.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
            </Button>
          </DialogTrigger>
          <AddTransactionDialog
            categories={categories}
            onAddTransaction={onAddTransaction}
            setIsOpen={setIsAddDialogOpen}
            onAddCategoryClick={onAddCategoryClick}
          />
        </Dialog>
      </CardHeader>
      <CardContent className="flex-grow">
        {sortedTransactions.length > 0 ? (
          <div className="space-y-4">
            {displayedTransactions.map(transaction => {
              const Icon = getCategoryIcon(transaction);
              return (
                <div key={transaction.id} className="flex items-center gap-4">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryName(transaction)} &middot;{' '}
                      {format(new Date(transaction.date), 'd MMM', {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'font-medium text-right',
                      transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{' '}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Belum ada transaksi.</p>
            <p className="text-sm">Klik "Tambah Transaksi" untuk memulai.</p>
          </div>
        )}
      </CardContent>
      {(sortedTransactions.length > 5 || visibleCount > 5) && (
        <CardFooter className="justify-center gap-2 pt-4">
          {sortedTransactions.length > visibleCount && (
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + 5)}
            >
              Lihat Transaksi Lainnya
            </Button>
          )}
          {visibleCount > 5 && (
            <Button variant="ghost" onClick={() => setVisibleCount(5)}>
              Tampilkan Lebih Sedikit
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function AddTransactionDialog({
  categories,
  onAddTransaction,
  setIsOpen,
  onAddCategoryClick,
}: {
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  setIsOpen: (open: boolean) => void;
  onAddCategoryClick: () => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const {toast} = useToast();

  const handleConfirmAdd = () => {
    if (
      !amount ||
      !description ||
      (type === 'expense' && !categoryId)
    ) {
      toast({
        title: 'Informasi Kurang',
        description: 'Harap isi semua kolom yang diperlukan.',
        variant: 'destructive',
      });
      return;
    }
    onAddTransaction({
      amount: parseFloat(amount),
      categoryId: type === 'income' ? 'income' : categoryId,
      description,
      type,
    });
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
    setType('expense');
  };
  
  const handleCreateCategoryClick = () => {
    setIsOpen(false); // Close current dialog
    onAddCategoryClick(); // Open category dialog
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tambah Transaksi Baru</DialogTitle>
        <DialogDescription>
          Catat pemasukan atau pengeluaran baru untuk anggaran Anda.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Jenis Transaksi</Label>
          <RadioGroup
            defaultValue="expense"
            className="flex gap-4"
            onValueChange={value => setType(value as 'income' | 'expense')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expense" id="r-expense" />
              <Label htmlFor="r-expense">Pengeluaran</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="r-income" />
              <Label htmlFor="r-income">Pemasukan</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              type === 'expense'
                ? 'cth: Kopi bersama teman'
                : 'cth: Gaji bulanan'
            }
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
          {type === 'expense' && (
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              {categories.length > 0 ? (
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
              ) : (
                <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleCreateCategoryClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Kategori Dulu
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
        >
          Batal
        </Button>
        <Button onClick={handleConfirmAdd}>Tambah</Button>
      </DialogFooter>
    </DialogContent>
  );
}
