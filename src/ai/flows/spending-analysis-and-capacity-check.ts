'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing spending and checking capacity.
 *
 * The flow takes in a transaction amount and category, along with the user's budget and spending data,
 * and determines whether the user has the capacity to add the transaction without exceeding their budget.
 *
 * @exports analyzeSpendingAndCheckCapacity - The main function that initiates the spending analysis and capacity check flow.
 * @exports SpendingAnalysisAndCapacityCheckInput - The input type for the analyzeSpendingAndCheckCapacity function.
 * @exports SpendingAnalysisAndCapacityCheckOutput - The output type for the analyzeSpendingAndCheckCapacity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingAnalysisAndCapacityCheckInputSchema = z.object({
  transactionAmount: z.number().describe('Jumlah transaksi.'),
  transactionCategory: z.string().describe('Kategori transaksi (misalnya, belanja bulanan, transportasi).'),
  monthlyBudget: z.number().describe('Total anggaran bulanan pengguna.'),
  categoryBudgetAllocation: z.record(z.string(), z.number()).describe('Catatan setiap kategori pengeluaran dan alokasi anggarannya.'),
  currentSpendingByCategory: z.record(z.string(), z.number()).describe('Catatan setiap kategori pengeluaran dan pengeluaran saat ini.'),
});
export type SpendingAnalysisAndCapacityCheckInput = z.infer<typeof SpendingAnalysisAndCapacityCheckInputSchema>;

const SpendingAnalysisAndCapacityCheckOutputSchema = z.object({
  canAddTransaction: z.boolean().describe('Apakah pengguna memiliki kapasitas untuk menambahkan transaksi tanpa melebihi anggaran mereka.'),
  remainingBudgetInCategory: z.number().describe('Sisa anggaran dalam kategori yang ditentukan setelah menambahkan transaksi.'),
  analysisResult: z.string().describe('Analisis terperinci tentang pengecekan pengeluaran dan kapasitas, termasuk peringatan potensi pengeluaran berlebih.'),
});
export type SpendingAnalysisAndCapacityCheckOutput = z.infer<typeof SpendingAnalysisAndCapacityCheckOutputSchema>;

export async function analyzeSpendingAndCheckCapacity(input: SpendingAnalysisAndCapacityCheckInput): Promise<SpendingAnalysisAndCapacityCheckOutput> {
  return spendingAnalysisAndCapacityCheckFlow(input);
}

const spendingAnalysisAndCapacityCheckPrompt = ai.definePrompt({
  name: 'spendingAnalysisAndCapacityCheckPrompt',
  input: {schema: SpendingAnalysisAndCapacityCheckInputSchema},
  output: {schema: SpendingAnalysisAndCapacityCheckOutputSchema},
  prompt: `Anda adalah seorang penasihat keuangan pribadi. Seorang pengguna ingin mencatat pengeluaran di bawah kategori yang telah ditentukan.

  Berdasarkan anggaran bulanan mereka, bagaimana anggaran dialokasikan di seluruh kategori, dan pengeluaran mereka saat ini, tentukan apakah mereka memiliki kapasitas untuk menambahkan transaksi.

  Pertimbangkan hal berikut:
  - Jumlah Transaksi: {{{transactionAmount}}}
  - Kategori Transaksi: {{{transactionCategory}}}
  - Anggaran Bulanan: {{{monthlyBudget}}}
  - Alokasi Anggaran Kategori: {{{categoryBudgetAllocation}}}
  - Pengeluaran Saat Ini per Kategori: {{{currentSpendingByCategory}}}

  Tentukan apakah pengguna dapat menambahkan transaksi tanpa melebihi anggaran mereka dalam kategori yang ditentukan. Hitung sisa anggaran dalam kategori tersebut setelah transaksi.

  Berikan analisis terperinci tentang temuan Anda, termasuk peringatan tentang potensi pengeluaran berlebih. Atur boolean canAddTransaction dengan benar.
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
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate remaining budget in the category.
    const allocatedBudget = categoryBudgetAllocation[transactionCategory] || 0;
    const currentSpending = currentSpendingByCategory[transactionCategory] || 0;
    const remainingBudgetInCategory = allocatedBudget - currentSpending - transactionAmount;

    const canAddTransaction = remainingBudgetInCategory >= 0;

    let analysisResult = '';
    if (canAddTransaction) {
      analysisResult = `Anda dapat menambahkan transaksi ini. Sisa anggaran di kategori ${transactionCategory}: ${formatCurrency(remainingBudgetInCategory)}.`;
    } else {
      analysisResult = `Peringatan: Menambahkan transaksi ini akan melebihi anggaran Anda di kategori ${transactionCategory} sebesar ${formatCurrency(Math.abs(remainingBudgetInCategory))}.`;
    }

    return {
      canAddTransaction,
      remainingBudgetInCategory,
      analysisResult,
    };
  }
);
