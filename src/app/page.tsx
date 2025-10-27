'use client';

import {useState, useMemo, useEffect} from 'react';
import type {Category, Transaction, MonthlyData, AppData} from '@/lib/types';
import {DEFAULT_CATEGORIES} from '@/lib/constants';
import {nanoid} from 'nanoid';
import Header from '@/components/dashboard/header';
import BudgetSummary from '@/components/dashboard/budget-summary';
import CategoriesList from '@/components/dashboard/categories-list';
import TransactionsList from '@/components/dashboard/transactions-list';
import {Sparkles} from 'lucide-react';
import {format, subMonths, addMonths} from 'date-fns';
import { id } from 'date-fns/locale';

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

const getDefaultMonthData = (): MonthlyData => ({
  monthlyBudget: 5000000,
  categories: DEFAULT_CATEGORIES.map(c => ({...c, budget: 0, spent: 0})),
  transactions: [],
});

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appData, setAppData] = useState<AppData>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedData = getInitialState<AppData>('budgetData', {});
      // Data migration for old users
      if (!savedData[format(new Date(), 'yyyy-MM')] && (localStorage.getItem('monthlyBudget') || localStorage.getItem('categories'))) {
        const oldBudget = getInitialState('monthlyBudget', 5000000);
        const oldCategories = getInitialState<Category[]>('categories', []);
        const oldTransactions = getInitialState<Transaction[]>('transactions', []);

        const monthKey = format(new Date(), 'yyyy-MM');
        const migratedData: AppData = {
          ...savedData,
          [monthKey]: {
            monthlyBudget: oldBudget,
            categories: oldCategories.length > 0 ? oldCategories : DEFAULT_CATEGORIES.map(c => ({ ...c, budget: 0, spent: 0 })),
            transactions: oldTransactions
          }
        };
        setAppData(migratedData);

        // Clean up old data
        localStorage.removeItem('monthlyBudget');
        localStorage.removeItem('categories');
        localStorage.removeItem('transactions');
      } else {
        setAppData(savedData);
      }
    }
  }, [isClient]);

  // Persist state to localStorage
  useEffect(() => {
    if (isClient && Object.keys(appData).length > 0) {
      const dataToSave: AppData = {};
       for (const month in appData) {
        dataToSave[month] = {
          ...appData[month],
          categories: appData[month].categories.map(({ icon, ...rest }) => rest),
        }
      }
      window.localStorage.setItem('budgetData', JSON.stringify(dataToSave));
    }
  }, [appData, isClient]);

  const monthKey = format(currentMonth, 'yyyy-MM');

  // Memoize current month data
  const currentMonthData = useMemo(() => {
    const data = appData[monthKey] || getDefaultMonthData();
    // Ensure categories have icons
    const categoriesWithIcons = data.categories.map(cat => {
      const defaultCat = DEFAULT_CATEGORIES.find(dc => dc.id === cat.id || dc.name === cat.name);
      return {
        ...cat,
        icon: defaultCat ? defaultCat.icon : Sparkles
      };
    });
    return { ...data, categories: categoriesWithIcons };
  }, [appData, monthKey]);

  const {monthlyBudget, categories, transactions} = currentMonthData;

  const {totalSpent, totalBudgeted} = useMemo(() => {
    const spent = categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    const budgeted = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
    return {totalSpent: spent, totalBudgeted: budgeted};
  }, [categories]);

  const updateMonthData = (month: string, data: Partial<MonthlyData>) => {
    setAppData(prev => ({
      ...prev,
      [month]: {
        ...(prev[month] || getDefaultMonthData()),
        ...data,
      }
    }));
  };

  const handleSetBudget = (amount: number) => {
    updateMonthData(monthKey, { monthlyBudget: amount });
  };

  const handleSetCategoryBudget = (categoryId: string, budget: number) => {
    const newCategories = categories.map(c =>
      c.id === categoryId ? {...c, budget} : c
    );
    updateMonthData(monthKey, { categories: newCategories });
  };

  const handleAddCategory = (name: string, budget: number, icon: React.ComponentType<{ className?: string }>) => {
    const newCategory: Category = {
      id: nanoid(),
      name,
      budget,
      icon,
      spent: 0
    };
    updateMonthData(monthKey, { categories: [...categories, newCategory] });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId);
    const newTransactions = transactions.filter(t => t.categoryId !== categoryId);
    updateMonthData(monthKey, { categories: newCategories, transactions: newTransactions });
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

    const newTransactions = [newTransaction, ...transactions];
    const newCategories = categories.map(c =>
      c.id === categoryId ? {...c, spent: c.spent + amount} : c
    );
    
    updateMonthData(monthKey, { transactions: newTransactions, categories: newCategories });
  };

  const changeMonth = (direction: 'next' | 'prev') => {
      const newMonth = direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
  }

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
            currentMonth={currentMonth}
            onChangeMonth={changeMonth}
          />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TransactionsList
              transactions={transactions}
              categories={categories}
              onAddTransaction={handleAddTransaction}
              monthlyBudget={monthlyBudget}
              categoryBudgetAllocation={Object.fromEntries(
                categories.map(c => [c.name, c.budget])
              )}
              currentSpendingByCategory={Object.fromEntries(
                categories.map(c => [c.name, c.spent])
              )}
            />
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
      </main>
    </div>
  );
}
