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
  increment,
} from 'firebase/firestore';
import type {Category, Transaction, Budget} from '@/lib/types';
import {useFirestore, useUser, useCollection} from '@/firebase';
import Header from '@/components/dashboard/header';
import BudgetSummary from '@/components/dashboard/budget-summary';
import QuoteCard from '@/components/dashboard/quote-card';
import CategoriesList from '@/components/dashboard/categories-list';
import TransactionsList from '@/components/dashboard/transactions-list';
import Footer from '@/components/footer';
import {format} from 'date-fns';
import {useToast} from '@/hooks/use-toast';
import {FINANCIAL_QUOTES} from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const {toast} = useToast();
  const {user, loading: userLoading} = useUser();
  const firestore = useFirestore();

  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prevIndex => (prevIndex + 1) % FINANCIAL_QUOTES.length);
    }, 10000); // Change quote every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const [initialBudgetCreated, setInitialBudgetCreated] = useState(false);
  const monthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  // Ensure queries are only created when user and firestore are available
  const budgetQuery = useMemo(() => {
    if (user && firestore && !userLoading) {
      return query(
        collection(firestore, 'budgets'),
        where('userId', '==', user.uid),
        where('month', '==', monthKey)
      );
    }
    return null;
  }, [user, firestore, monthKey, userLoading]);

  const {
    data: budgets,
    loading: budgetsLoading,
    error: budgetError,
  } = useCollection<Budget>(budgetQuery);
  const budget = useMemo(() => (budgets && budgets[0]) || null, [budgets]);
  const budgetId = budget?.id;

  // Ensure queries are only created when budgetId and firestore are available
  const categoriesQuery = useMemo(() => {
    if (budgetId && firestore) {
      return collection(firestore, 'budgets', budgetId, 'categories');
    }
    return null;
  }, [budgetId, firestore]);

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCollection<Category>(categoriesQuery);

  // Ensure queries are only created when budgetId and firestore are available
  const transactionsQuery = useMemo(() => {
    if (budgetId && firestore) {
      return collection(firestore, 'budgets', budgetId, 'transactions');
    }
    return null;
  }, [budgetId, firestore]);

  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useCollection<Transaction>(transactionsQuery);

  useEffect(() => {
    if (
      user &&
      firestore &&
      !budgetsLoading &&
      budgets?.length === 0 &&
      !initialBudgetCreated
    ) {
      const createInitialBudget = async () => {
        setInitialBudgetCreated(true); // Prevent re-running
        try {
          await addDoc(collection(firestore, 'budgets'), {
            userId: user.uid,
            month: monthKey,
            monthlyBudget: 0,
          });

          toast({
            title: 'Selamat Datang!',
            description: `Anggaran untuk bulan ${monthKey} telah dibuat. Silakan atur anggaran Anda.`,
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
    transaction: Omit<Transaction, 'id' | 'date'>
  ) => {
    if (!budgetId || !firestore) return;

    try {
      const batch = writeBatch(firestore);
      const transactionRef = doc(
        collection(firestore, 'budgets', budgetId, 'transactions')
      );
      
      batch.set(transactionRef, {
        ...transaction,
        date: new Date().toISOString(),
      });

      if (transaction.type === 'expense') {
        const category = categories?.find(c => c.id === transaction.categoryId);
        if (!category) {
          toast({
            title: 'Gagal',
            description: 'Kategori tidak ditemukan.',
            variant: 'destructive',
          });
          return;
        }
        const categoryRef = doc(
          firestore,
          'budgets',
          budgetId,
          'categories',
          transaction.categoryId
        );
        batch.update(categoryRef, { spent: increment(transaction.amount) });
      } else if (transaction.type === 'income') {
        const budgetRef = doc(firestore, 'budgets', budgetId);
        batch.update(budgetRef, { monthlyBudget: increment(transaction.amount) });
      }

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
    userLoading ||
    (user && (budgetsLoading || categoriesLoading || transactionsLoading));

  // Show a loading screen while user status or data is being fetched.
  if (loading || userLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <p>Loading...</p>
      </div>
    );
  }

  // Handle data loading errors
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
        <div className="grid gap-4">
          <QuoteCard quote={FINANCIAL_QUOTES[quoteIndex]} />
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
