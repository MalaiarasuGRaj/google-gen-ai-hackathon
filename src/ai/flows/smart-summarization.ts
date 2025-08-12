'use server';

/**
 * @fileOverview Provides a smart summarization AI agent for legal documents.
 *
 * - smartSummarization - A function that generates a summary of a legal document.
 * - SmartSummarizationInput - The input type for the smartSummarization function.
 * - SmartSummarizationOutput - The return type for the smartSummarization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSummarizationInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the legal document to summarize.'),
});
export type SmartSummarizationInput = z.infer<typeof SmartSummarizationInputSchema>;

const SmartSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the legal document, highlighting key terms and obligations.'
    ),
});
export type SmartSummarizationOutput = z.infer<typeof SmartSummarizationOutputSchema>;

export async function smartSummarization(
  input: SmartSummarizationInput
): Promise<SmartSummarizationOutput> {
  return smartSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSummarizationPrompt',
  input: {schema: SmartSummarizationInputSchema},
  output: {schema: SmartSummarizationOutputSchema},
  prompt: `You are an AI legal assistant tasked with summarizing legal documents.

  Please provide a concise summary of the following legal document, highlighting key terms and obligations:

  Document:
  {{documentText}}`,
});

const smartSummarizationFlow = ai.defineFlow(
  {
    name: 'smartSummarizationFlow',
    inputSchema: SmartSummarizationInputSchema,
    outputSchema: SmartSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
