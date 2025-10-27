'use client';

import {useState, useMemo, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import type {Category, Transaction, Budget} from '@/lib/types';
import {DEFAULT_CATEGORIES} from '@/lib/constants';
import {useAuth, useFirestore, useUser, useCollection} from '@/firebase';
import Header from '@/components/dashboard/header';
import BudgetSummary from '@/components/dashboard/budget-summary';
import CategoriesList from '@/components/dashboard/categories-list';
import TransactionsList from '@/components/dashboard/transactions-list';
import Footer from '@/components/footer';
import {format} from 'date-fns';
import {useToast} from '@/hooks/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const {toast} = useToast();
  const {user, loading: userLoading} = useUser();
  const firestore = useFirestore();

  const [initialBudgetCreated, setInitialBudgetCreated] = useState(false);
  const monthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  const budgetQuery =
    user && firestore
      ? query(
          collection(firestore, 'budgets'),
          where('userId', '==', user.uid),
          where('month', '==', monthKey)
        )
      : null;

  const {
    data: budgets,
    loading: budgetsLoading,
    error: budgetError,
  } = useCollection<Budget>(budgetQuery);
  const budget = useMemo(() => (budgets && budgets[0]) || null, [budgets]);
  const budgetId = budget?.id;

  const categoriesQuery =
    budgetId && firestore
      ? collection(firestore, 'budgets', budgetId, 'categories')
      : null;
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCollection<Category>(categoriesQuery);

  const transactionsQuery =
    budgetId && firestore
      ? collection(firestore, 'budgets', budgetId, 'transactions')
      : null;
  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useCollection<Transaction>(transactionsQuery);

  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (
      user &&
      firestore &&
      !budgetsLoading &&
      !budgets?.length &&
      !initialBudgetCreated
    ) {
      const createInitialBudget = async () => {
        setInitialBudgetCreated(true); // Prevent re-running
        try {
          const newBudgetRef = await addDoc(collection(firestore, 'budgets'), {
            userId: user.uid,
            month: monthKey,
            monthlyBudget: 5000000,
          });

          const batch = writeBatch(firestore);
          DEFAULT_CATEGORIES.forEach(category => {
            const categoryRef = doc(
              collection(firestore, 'budgets', newBudgetRef.id, 'categories')
            );
            batch.set(categoryRef, {
              name: category.name,
              iconName: category.iconName,
              budget: 0,
              spent: 0,
            });
          });
          await batch.commit();
          toast({
            title: 'Anggaran Dibuat',
            description: `Anggaran untuk bulan ${monthKey} telah dibuat.`,
          });
        } catch (error) {
          console.error('Error creating initial budget:', error);
          toast({
            title: 'Gagal Membuat Anggaran',
            description: 'Terjadi kesalahan saat membuat anggaran awal.',
            variant: 'destructive',
          });
          setInitialBudgetCreated(false); // Allow retry if it fails
        }
      };
      createInitialBudget();
    }
  }, [
    user,
    firestore,
    monthKey,
    budgetsLoading,
    budgets,
    toast,
    initialBudgetCreated,
  ]);

  const {totalSpent, totalBudgeted} = useMemo(() => {
    const spent =
      categories?.reduce((sum, cat) => sum + (cat.spent || 0), 0) || 0;
    const budgeted =
      categories?.reduce((sum, cat) => sum + (cat.budget || 0), 0) || 0;
    return {totalSpent: spent, totalBudgeted: budgeted};
  }, [categories]);

  const handleSetBudget = async (amount: number) => {
    if (budgetId && firestore) {
      try {
        await updateDoc(doc(firestore, 'budgets', budgetId), {
          monthlyBudget: amount,
        });
        toast({
          title: 'Sukses',
          description: 'Anggaran bulanan berhasil diperbarui.',
        });
      } catch (error) {
        console.error('Error setting budget:', error);
        toast({
          title: 'Gagal',
          description: 'Gagal memperbarui anggaran bulanan.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSetCategoryBudget = async (
    categoryId: string,
    budget: number
  ) => {
    if (budgetId && firestore) {
      try {
        await updateDoc(
          doc(firestore, 'budgets', budgetId, 'categories', categoryId),
          {budget}
        );
        toast({
          title: 'Sukses',
          description: 'Anggaran kategori berhasil diperbarui.',
        });
      } catch (error) {
        console.error('Error setting category budget:', error);
        toast({
          title: 'Gagal',
          description: 'Gagal memperbarui anggaran kategori.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddCategory = async (
    name: string,
    budget: number,
    iconName: string
  ) => {
    if (budgetId && firestore) {
      try {
        await addDoc(collection(firestore, 'budgets', budgetId, 'categories'), {
          name,
          budget,
          iconName,
          spent: 0,
        });
        toast({
          title: 'Sukses',
          description: `Kategori "${name}" berhasil ditambahkan.`,
        });
      } catch (error) {
        console.error('Error adding category:', error);
        toast({
          title: 'Gagal',
          description: 'Gagal menambahkan kategori baru.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!budgetId || !firestore) return;
    try {
      const batch = writeBatch(firestore);
      const categoryRef = doc(
        firestore,
        'budgets',
        budgetId,
        'categories',
        categoryId
      );

      // Find and delete all transactions in this category
      const transQuery = query(
        collection(firestore, 'budgets', budgetId, 'transactions'),
        where('categoryId', '==', categoryId)
      );
      const transSnapshot = await getDocs(transQuery);
      transSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the category itself
      batch.delete(categoryRef);

      await batch.commit();
      toast({
        title: 'Sukses',
        description: 'Kategori dan semua transaksinya berhasil dihapus.',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus kategori.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTransaction = async (
    amount: number,
    categoryId: string,
    description: string
  ) => {
    if (!budgetId || !firestore || !categories) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      toast({
        title: 'Gagal',
        description: 'Kategori tidak ditemukan.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const batch = writeBatch(firestore);

      // Add new transaction
      const transactionRef = doc(
        collection(firestore, 'budgets', budgetId, 'transactions')
      );
      batch.set(transactionRef, {
        amount,
        categoryId,
        description,
        date: new Date().toISOString(),
      });

      // Update category's spent amount
      const categoryRef = doc(
        firestore,
        'budgets',
        budgetId,
        'categories',
        categoryId
      );
      batch.update(categoryRef, {
        spent: category.spent + amount,
      });

      await batch.commit();

      toast({
        title: 'Sukses',
        description: 'Transaksi berhasil ditambahkan.',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menambahkan transaksi.',
        variant: 'destructive',
      });
    }
  };


  const loading =
    userLoading || budgetsLoading || categoriesLoading || transactionsLoading;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <p>Loading...</p>
      </div>
    );
  }

  if (budgetError || categoriesError || transactionsError) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-destructive/10 text-destructive">
        <p>Terjadi kesalahan saat memuat data:</p>
        <pre className="mt-2 text-xs">
          {budgetError?.message ||
            categoriesError?.message ||
            transactionsError?.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <BudgetSummary
            monthlyBudget={budget?.monthlyBudget || 0}
            totalSpent={totalSpent}
            totalBudgeted={totalBudgeted}
            onSetBudget={handleSetBudget}
          />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TransactionsList
              transactions={transactions || []}
              categories={categories || []}
              onAddTransaction={handleAddTransaction}
            />
          </div>
          <div>
            <CategoriesList
              categories={categories || []}
              onSetCategoryBudget={handleSetCategoryBudget}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              totalBudgeted={totalBudgeted}
              monthlyBudget={budget?.monthlyBudget || 0}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
