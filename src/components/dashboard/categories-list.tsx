'use client';

import {useState} from 'react';
import type {Category, DefaultCategory} from '@/lib/types';
import {DEFAULT_CATEGORIES} from '@/lib/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Progress} from '@/components/ui/progress';
import {
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CategoriesListProps = {
  categories: Category[];
  totalBudgeted: number;
  monthlyBudget: number;
  onSetCategoryBudget: (categoryId: string, budget: number) => void;
  onAddCategory: (name: string, budget: number, icon: React.ComponentType<{ className?: string }>) => void;
  onDeleteCategory: (categoryId: string) => void;
};

export default function CategoriesList({
  categories,
  totalBudgeted,
  monthlyBudget,
  onSetCategoryBudget,
  onAddCategory,
  onDeleteCategory
}: CategoriesListProps) {
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const unallocated = monthlyBudget - totalBudgeted;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className='flex-row items-center justify-between'>
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Allocate your budget.</CardDescription>
        </div>
         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add</Button>
            </DialogTrigger>
            <AddCategoryDialog onAddCategory={onAddCategory} setIsOpen={setIsAddDialogOpen} />
        </Dialog>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <div className="space-y-4">
          {categories.map(category => (
            <CategoryItem key={category.id} category={category} formatCurrency={formatCurrency} onSetCategoryBudget={onSetCategoryBudget} onDeleteCategory={onDeleteCategory}/>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start pt-4">
        <div className="text-sm font-medium">Total Allocated: {formatCurrency(totalBudgeted)}</div>
        <div className={`text-xs ${unallocated < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            Unallocated: {formatCurrency(unallocated)}
        </div>
      </CardFooter>
    </Card>
  );
}

function CategoryItem({ category, formatCurrency, onSetCategoryBudget, onDeleteCategory }: { category: Category, formatCurrency: (amount: number) => string, onSetCategoryBudget: (categoryId: string, budget: number) => void, onDeleteCategory: (categoryId: string) => void }) {
    const [isEdit, setIsEdit] = useState(false);
    const [newBudget, setNewBudget] = useState(category.budget.toString());
    const progress = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
    
    const handleSave = () => {
        const amount = parseFloat(newBudget);
        if(!isNaN(amount)) {
            onSetCategoryBudget(category.id, amount);
        }
        setIsEdit(false);
    }
    
    const Icon = category.icon;

    return (
        <div>
            <div className="flex items-center gap-4">
              {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center gap-2">
                    {isEdit ? (
                        <>
                         <Input type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-8 w-24 text-right" />
                         <Button size="sm" onClick={handleSave}>Save</Button>
                         <Button size="sm" variant="ghost" onClick={() => setIsEdit(false)}>Cancel</Button>
                        </>
                    ) : (
                        <>
                        <span className="text-sm text-muted-foreground cursor-pointer" onClick={() => setIsEdit(true)}>{formatCurrency(category.budget)}</span>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the "{category.name}" category and all its transactions. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteCategory(category.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </>
                    )}
                   </div>
                </div>
                 <div className="text-xs text-muted-foreground">Spent {formatCurrency(category.spent)}</div>
              </div>
            </div>
            <Progress value={progress} className="mt-2 h-2" />
        </div>
    )
}

function AddCategoryDialog({ onAddCategory, setIsOpen }: { onAddCategory: (name: string, budget: number, icon: React.ComponentType<{ className?: string }>) => void, setIsOpen: (open: boolean) => void }) {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleSave = () => {
        const budgetAmount = parseFloat(budget) || 0;
        let categoryIcon: React.ComponentType<{ className?: string }> = Sparkles;
        let categoryName = name;
        
        if (selectedTemplate) {
            const template = DEFAULT_CATEGORIES.find(c => c.id === selectedTemplate);
            if(template) {
                categoryIcon = template.icon;
                categoryName = template.name;
            }
        }
        
        if (categoryName) {
            onAddCategory(categoryName, budgetAmount, categoryIcon);
            setIsOpen(false);
            setName('');
            setBudget('');
            setSelectedTemplate(null);
        }
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                    Create a custom category or choose from a template.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select onValueChange={(value) => setSelectedTemplate(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose from a template..." />
                        </SelectTrigger>
                        <SelectContent>
                            {DEFAULT_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 { !selectedTemplate && (
                    <div className="space-y-2">
                        <Label htmlFor="name">Custom Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Subscriptions" />
                    </div>
                 )}
                 <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., 50" />
                 </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Add Category</Button>
            </DialogFooter>
        </DialogContent>
    );
}
