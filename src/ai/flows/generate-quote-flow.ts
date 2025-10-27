'use server';
/**
 * @fileOverview A flow to generate a short financial quote.
 *
 * - generateQuote - A function that returns a short financial quote.
 * - QuoteOutput - The return type for the generateQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuoteOutputSchema = z.object({
  quote: z
    .string()
    .describe('A short, motivational financial quote in Indonesian.'),
});
export type QuoteOutput = z.infer<typeof QuoteOutputSchema>;

export async function generateQuote(): Promise<QuoteOutput> {
  return await generateQuoteFlow();
}

const prompt = ai.definePrompt({
  name: 'generateQuotePrompt',
  output: {schema: QuoteOutputSchema},
  prompt: `Generate a short, motivational financial quote in Indonesian. The quote must be a maximum of 20 words.`,
});

const generateQuoteFlow = ai.defineFlow(
  {
    name: 'generateQuoteFlow',
    outputSchema: QuoteOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
