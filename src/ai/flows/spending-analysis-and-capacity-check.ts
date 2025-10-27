'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing spending and checking capacity.
 *
 * The flow takes in a transaction amount and category, along with the user's budget and spending data,
 * and determines whether the user has the capacity to add the transaction without exceeding their budget.
 *
 * @exports analyzeSpendingAndCheckCapacity - The main function that initiates the spending analysis and capacity check flow.
 * @exports SpendingAnalysisAndCapacityCheckInput - The input type for the analyzeSpendingAndCheckCapacity function.
 * @exports SpendingAnalysisAndCapacityCheckOutput - The output type for the analyzeSpendingAndCapacityCheckOutput function.
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
  - Jumlah Transaksi: {{transactionAmount}}
  - Kategori Transaksi: {{transactionCategory}}
  - Anggaran Bulanan: {{monthlyBudget}}
  - Alokasi Anggaran Kategori: {{jsonStringify categoryBudgetAllocation}}
  - Pengeluaran Saat Ini per Kategori: {{jsonStringify currentSpendingByCategory}}

  Tentukan apakah pengguna dapat menambahkan transaksi tanpa melebihi anggaran mereka dalam kategori yang ditentukan. Hitung sisa anggaran dalam kategori tersebut setelah transaksi.

  Berikan analisis terperinci tentang temuan Anda. Jika transaksi dapat ditambahkan, sebutkan sisa anggaran. Jika pengeluaran baru membuat total pengeluaran kategori di atas 70% dari anggarannya, berikan peringatan untuk berhati-hati. Jika transaksi menyebabkan pengeluaran berlebih, nyatakan dengan jelas berapa jumlah kelebihannya. Atur boolean canAddTransaction dengan benar.
  `,
});

const spendingAnalysisAndCapacityCheckFlow = ai.defineFlow(
  {
    name: 'spendingAnalysisAndCapacityCheckFlow',
    inputSchema: SpendingAnalysisAndCapacityCheckInputSchema,
    outputSchema: SpendingAnalysisAndCapacityCheckOutputSchema,
  },
  async input => {
    const {output} = await spendingAnalysisAndCapacityCheckPrompt(input);
    return output!;
  }
);
