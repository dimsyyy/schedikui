'use client';

import {useState, useMemo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Pencil, AlertTriangle} from 'lucide-react';
import {Progress} from '../ui/progress';
import {format} from 'date-fns';
import {id} from 'date-fns/locale';

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
  const [isSetBudgetDialogOpen, setIsSetBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());

  const remainingBudget = monthlyBudget - totalSpent;
  const spendingProgress =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  const remainingPercentage =
    monthlyBudget > 0 ? (remainingBudget / monthlyBudget) * 100 : 100;

  const currentMonthDate = useMemo(() => new Date(), []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(newBudget);
    if (!isNaN(amount)) {
      onSetBudget(amount);
    }
    setIsSetBudgetDialogOpen(false);
  };

  return (
    <>
      <Card className="sm:col-span-2 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg dark:bg-gradient-to-br dark:from-card dark:to-muted/30 dark:text-foreground dark:border dark:border-border">
        <CardHeader className="pb-2">
          <div className="flex justify-center items-center text-center">
            <div>
              <CardTitle className="text-lg capitalize">
                {format(currentMonthDate, 'MMMM yyyy', {locale: id})}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 dark:text-muted-foreground">Ringkasan Bulanan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold flex items-center justify-center gap-2">
            {formatCurrency(monthlyBudget)}
          </div>
          <CardDescription className="text-primary-foreground/80 dark:text-muted-foreground">Total anggaran bulanan Anda.</CardDescription>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <div className="w-full">
            <div className="flex justify-between text-sm text-primary-foreground/80 dark:text-muted-foreground mb-1">
              <span>Terpakai: {formatCurrency(totalSpent)}</span>
              <span>Sisa: {formatCurrency(remainingBudget)}</span>
            </div>
            <Progress
              value={spendingProgress}
              aria-label={`${spendingProgress.toFixed(0)}% dari anggaran terpakai`}
              className="bg-primary/30 dark:bg-muted"
              indicatorClassName="bg-white dark:bg-primary"
            />
          </div>
           <div className="flex w-full gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30 dark:bg-transparent dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              onClick={() => setIsSetBudgetDialogOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Atur Anggaran
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Pengeluaran</CardDescription>
          <CardTitle className="text-3xl text-destructive">
            {formatCurrency(totalSpent)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(totalBudgeted)} dialokasikan
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Sisa Anggaran</CardDescription>
          <CardTitle
            className={`text-3xl ${
              remainingBudget < 0 ? 'text-destructive' : 'text-emerald-500'
            }`}
          >
            {formatCurrency(remainingBudget)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-xs ${
              remainingBudget < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {remainingBudget < 0 ? (
              'Anda melebihi anggaran'
            ) : remainingPercentage <= 30 ? (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Saatnya berhemat!
              </span>
            ) : (
              'Sesuai rencana'
            )}
          </div>
        </CardContent>
      </Card>

      {/* Set Budget Dialog */}
      <Dialog open={isSetBudgetDialogOpen} onOpenChange={setIsSetBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Ulang Anggaran Bulanan</DialogTitle>
            <DialogDescription>
              Masukkan total pendapatan atau jumlah yang ingin Anda anggarkan
              untuk bulan ini. Ini akan **menggantikan** nilai anggaran saat ini.
              Untuk menambah dana, gunakan fitur "Tambah Transaksi".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget" className="text-right">
                Anggaran
              </Label>
              <Input
                id="budget"
                type="number"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
                className="col-span-3"
                placeholder="cth: 5000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSetBudgetDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSaveBudget}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
