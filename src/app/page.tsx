'use client';

import {useState, useMemo, useEffect} from 'react';
import type {Category, Transaction} from '@/lib/types';
import {DEFAULT_CATEGORIES} from '@/lib/constants';
import {nanoid} from 'nanoid';
import {Header} from '@/components/dashboard/header';
import BudgetSummary from '@/components/dashboard/budget-summary';
import SpendingReport from '@/components/dashboard/spending-report';
import CategoriesList from '@/components/dashboard/categories-list';
import TransactionsList from '@/components/dashboard/transactions-list';

// Helper to get data from localStorage
const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() =>
    getInitialState('monthlyBudget', 3000)
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    getInitialState('categories', 
      DEFAULT_CATEGORIES.map(c => ({...c, budget: 0, spent: 0 }))
    )
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getInitialState('transactions', [])
  );

  // Persist state to localStorage
  useEffect(() => {
    if (isClient) {
      window.localStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget));
    }
  }, [monthlyBudget, isClient]);

  useEffect(() => {
    if (isClient) {
      window.localStorage.setItem('categories', JSON.stringify(categories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if (isClient) {
      window.localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, isClient]);

  const {totalSpent, totalBudgeted} = useMemo(() => {
    const spent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const budgeted = categories.reduce((sum, cat) => sum + cat.budget, 0);
    return {totalSpent: spent, totalBudgeted: budgeted};
  }, [categories]);

  const handleSetBudget = (amount: number) => {
    setMonthlyBudget(amount);
  };
  
  const handleSetCategoryBudget = (categoryId: string, budget: number) => {
    setCategories(prev =>
      prev.map(c => (c.id === categoryId ? {...c, budget} : c))
    );
  };

  const handleAddCategory = (name: string, budget: number, icon: React.ComponentType) => {
    const newCategory: Category = {
      id: nanoid(),
      name,
      budget,
      icon,
      spent: 0
    };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    setTransactions(prev => prev.filter(t => t.categoryId !== categoryId));
  };


  const handleAddTransaction = (
    amount: number,
    categoryId: string,
    description: string
  ) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newTransaction: Transaction = {
      id: nanoid(),
      amount,
      categoryId,
      categoryName: category.name,
      description,
      date: new Date().toISOString(),
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? {...c, spent: c.spent + amount} : c
      )
    );
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <BudgetSummary
            monthlyBudget={monthlyBudget}
            totalSpent={totalSpent}
            totalBudgeted={totalBudgeted}
            onSetBudget={handleSetBudget}
          />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SpendingReport categories={categories} />
          </div>
          <div>
            <CategoriesList
              categories={categories}
              onSetCategoryBudget={handleSetCategoryBudget}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              totalBudgeted={totalBudgeted}
              monthlyBudget={monthlyBudget}
            />
          </div>
        </div>
        <div>
          <TransactionsList
            transactions={transactions}
            categories={categories}
            onAddTransaction={handleAddTransaction}
            monthlyBudget={monthlyBudget}
            categoryBudgetAllocation={Object.fromEntries(categories.map(c => [c.name, c.budget]))}
            currentSpendingByCategory={Object.fromEntries(categories.map(c => [c.name, c.spent]))}
          />
        </div>
      </main>
    </div>
  );
}
