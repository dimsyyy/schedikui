'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing spending and checking capacity.
 *
 * The flow takes in a transaction amount and category, along with the user's budget and spending data,
 * and determines whether the user has the capacity to add the transaction without exceeding their budget.
 *
 * @exports analyzeSpendingAndCheckCapacity - The main function that initiates the spending analysis and capacity check flow.
 * @exports SpendingAnalysisAndCapacityCheckInput - The input type for the analyzeSpendingAndCheckCapacity function.
 * @exports SpendingAnalysisAndCapacityCheckOutput - The output type for the analyzeSpendingAndCapacityCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingAnalysisAndCapacityCheckInputSchema = z.object({
  transactionAmount: z.number().describe('The amount of the transaction.'),
  transactionCategory: z.string().describe('The category of the transaction (e.g., groceries, transportation).'),
  monthlyBudget: z.number().describe('The user\u0027s total monthly budget.'),
  categoryBudgetAllocation: z.record(z.string(), z.number()).describe('A record of each spending category and its allocated budget.'),
  currentSpendingByCategory: z.record(z.string(), z.number()).describe('A record of each spending category and its current spending.'),
});
export type SpendingAnalysisAndCapacityCheckInput = z.infer<typeof SpendingAnalysisAndCapacityCheckInputSchema>;

const SpendingAnalysisAndCapacityCheckOutputSchema = z.object({
  canAddTransaction: z.boolean().describe('Whether the user has the capacity to add the transaction without exceeding their budget.'),
  remainingBudgetInCategory: z.number().describe('The remaining budget in the specified category after adding the transaction.'),
  analysisResult: z.string().describe('A detailed analysis of the spending and capacity check, including potential overspending warnings.'),
});
export type SpendingAnalysisAndCapacityCheckOutput = z.infer<typeof SpendingAnalysisAndCapacityCheckOutputSchema>;

export async function analyzeSpendingAndCheckCapacity(input: SpendingAnalysisAndCapacityCheckInput): Promise<SpendingAnalysisAndCapacityCheckOutput> {
  return spendingAnalysisAndCapacityCheckFlow(input);
}

const spendingAnalysisAndCapacityCheckPrompt = ai.definePrompt({
  name: 'spendingAnalysisAndCapacityCheckPrompt',
  input: {schema: SpendingAnalysisAndCapacityCheckInputSchema},
  output: {schema: SpendingAnalysisAndCapacityCheckOutputSchema},
  prompt: `You are a personal finance advisor. A user wants to record an expense under a predefined category.

  Based on their monthly budget, how their budget is allocated across categories, and their current spending, determine if they have the capacity to add the transaction.

  Consider the following:
  - Transaction Amount: {{{transactionAmount}}}
  - Transaction Category: {{{transactionCategory}}}
  - Monthly Budget: {{{monthlyBudget}}}
  - Category Budget Allocation: {{{categoryBudgetAllocation}}}
  - Current Spending by Category: {{{currentSpendingByCategory}}}

  Determine if the user can add the transaction without exceeding their budget in the specified category. Calculate the remaining budget in that category after the transaction.

  Provide a detailed analysis of your findings, including any warnings about potential overspending. Set the canAddTransaction boolean accordingly.
  `,
});

const spendingAnalysisAndCapacityCheckFlow = ai.defineFlow(
  {
    name: 'spendingAnalysisAndCapacityCheckFlow',
    inputSchema: SpendingAnalysisAndCapacityCheckInputSchema,
    outputSchema: SpendingAnalysisAndCapacityCheckOutputSchema,
  },
  async input => {
    const {transactionAmount, transactionCategory, monthlyBudget, categoryBudgetAllocation, currentSpendingByCategory} = input;

    // Calculate remaining budget in the category.
    const allocatedBudget = categoryBudgetAllocation[transactionCategory] || 0;
    const currentSpending = currentSpendingByCategory[transactionCategory] || 0;
    const remainingBudgetInCategory = allocatedBudget - currentSpending - transactionAmount;

    const canAddTransaction = remainingBudgetInCategory >= 0;

    let analysisResult = '';
    if (canAddTransaction) {
      analysisResult = `You can add the transaction. Remaining budget in ${transactionCategory}: $${remainingBudgetInCategory.toFixed(2)}.`;
    } else {
      analysisResult = `Warning: Adding this transaction will exceed your budget in ${transactionCategory} by $${Math.abs(remainingBudgetInCategory).toFixed(2)}.`;
    }

    return {
      canAddTransaction,
      remainingBudgetInCategory,
      analysisResult,
    };
  }
);
