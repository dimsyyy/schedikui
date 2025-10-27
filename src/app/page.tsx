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
} from 'firebase/firestore';
import type {Category, Transaction, Budget} from '@/lib/types';
import {DEFAULT_CATEGORIES} from '@/lib/constants';
import {nanoid} from 'nanoid';
import {useAuth, useFirestore, useUser, useCollection, useDoc} from '@/firebase';
import Header from '@/components/dashboard/header';
import BudgetSummary from '@/components/dashboard/budget-summary';
import CategoriesList from '@/components/dashboard/categories-list';
import TransactionsList from '@/components/dashboard/transactions-list';
import Footer from '@/components/footer';
import {format, subMonths, addMonths} from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const {user, loading: userLoading} = useUser();
  const firestore = useFirestore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = format(currentMonth, 'yyyy-MM');

  const budgetQuery =
    user && firestore
      ? query(
          collection(firestore, 'budgets'),
          where('userId', '==', user.uid),
          where('month', '==', monthKey)
        )
      : null;

  const {data: budgets, loading: budgetsLoading} = useCollection(budgetQuery);
  const budget = useMemo(() => (budgets && budgets[0]) || null, [budgets]);
  const budgetId = budget?.id;

  const categoriesQuery =
    budgetId && firestore
      ? collection(firestore, 'budgets', budgetId, 'categories')
      : null;
  const {data: categories, loading: categoriesLoading} =
    useCollection(categoriesQuery);

  const transactionsQuery =
    budgetId && firestore
      ? collection(firestore, 'budgets', budgetId, 'transactions')
      : null;
  const {data: transactions, loading: transactionsLoading} =
    useCollection(transactionsQuery);

  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Create budget for the month if it doesn't exist
  useEffect(() => {
    if (user && firestore && !budgetsLoading && !budgets?.length) {
      const createInitialBudget = async () => {
        const newBudgetRef = await addDoc(collection(firestore, 'budgets'), {
          userId: user.uid,
          month: monthKey,
          monthlyBudget: 5000000,
        });

        const batch = writeBatch(firestore);
        DEFAULT_CATEGORIES.forEach(category => {
          const categoryRef = doc(
            collection(
              firestore,
              'budgets',
              newBudgetRef.id,
              'categories'
            )
          );
          batch.set(categoryRef, {
            name: category.name,
            iconName: category.iconName,
            budget: 0,
            spent: 0,
          });
        });
        await batch.commit();
      };
      createInitialBudget();
    }
  }, [user, firestore, monthKey, budgetsLoading, budgets]);

  const {totalSpent, totalBudgeted} = useMemo(() => {
    const spent = categories?.reduce((sum, cat) => sum + (cat.spent || 0), 0) || 0;
    const budgeted = categories?.reduce((sum, cat) => sum + (cat.budget || 0), 0) || 0;
    return {totalSpent: spent, totalBudgeted: budgeted};
  }, [categories]);

  const handleSetBudget = async (amount: number) => {
    if (budgetId && firestore) {
      await updateDoc(doc(firestore, 'budgets', budgetId), {
        monthlyBudget: amount,
      });
    }
  };

  const handleSetCategoryBudget = async (categoryId: string, budget: number) => {
    if (budgetId && firestore) {
      await updateDoc(
        doc(firestore, 'budgets', budgetId, 'categories', categoryId),
        {budget}
      );
    }
  };

  const handleAddCategory = async (name: string, budget: number, iconName: string) => {
     if (budgetId && firestore) {
        await addDoc(collection(firestore, 'budgets', budgetId, 'categories'), {
            name,
            budget,
            iconName,
            spent: 0
        });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (budgetId && firestore) {
       // This is a simplified version. In a real app, you'd want a transaction
       // to also delete all transactions associated with this category.
      await deleteDoc(doc(firestore, 'budgets', budgetId, 'categories', categoryId));
    }
  };

  const handleAddTransaction = async (
    amount: number,
    categoryId: string,
    description: string
  ) => {
    const category = categories?.find(c => c.id === categoryId);
    if (!category || !budgetId || !firestore) return;

    await addDoc(collection(firestore, 'budgets', budgetId, 'transactions'), {
        amount,
        categoryId,
        description,
        date: new Date().toISOString(),
    });

    await updateDoc(doc(firestore, 'budgets', budgetId, 'categories', categoryId), {
        spent: category.spent + amount
    });
  };

  const changeMonth = (direction: 'next' | 'prev') => {
    const newMonth =
      direction === 'next'
        ? addMonths(currentMonth, 1)
        : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };
  
  const loading = userLoading || budgetsLoading || categoriesLoading || transactionsLoading;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <p>Loading...</p>
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
            currentMonth={currentMonth}
            onChangeMonth={changeMonth}
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
