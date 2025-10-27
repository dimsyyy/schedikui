'use server';

import {
  analyzeSpendingAndCheckCapacity,
  type SpendingAnalysisAndCapacityCheckInput,
} from '@/ai/flows/spending-analysis-and-capacity-check';

export async function checkTransactionCapacity(
  input: SpendingAnalysisAndCapacityCheckInput
) {
  try {
    const result = await analyzeSpendingAndCheckCapacity(input);
    return {success: true, data: result};
  } catch (error) {
    console.error('Error in GenAI capacity check:', error);
    return {success: false, error: 'Failed to analyze transaction capacity.'};
  }
}
