// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Identifies and extracts individual clauses from a legal document.
 *
 * - identifyClauses - A function that handles the clause identification process.
 * - IdentifyClausesInput - The input type for the identifyClauses function.
 * - IdentifyClausesOutput - The return type for the identifyClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyClausesInputSchema = z.object({
  documentText: z
    .string()
    .describe('The full text of the legal document.'),
});
export type IdentifyClausesInput = z.infer<typeof IdentifyClausesInputSchema>;

const IdentifyClausesOutputSchema = z.object({
  clauses: z.array(z.string()).describe('An array of all the clauses identified in the document.'),
});
export type IdentifyClausesOutput = z.infer<typeof IdentifyClausesOutputSchema>;

export async function identifyClauses(input: IdentifyClausesInput): Promise<IdentifyClausesOutput> {
  return identifyClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyClausesPrompt',
  input: {schema: IdentifyClausesInputSchema},
  output: {schema: IdentifyClausesOutputSchema},
  prompt: `You are an expert at parsing legal documents. Your task is to identify and extract every distinct clause from the provided document text.

  A clause is a self-contained paragraph or section that typically starts with a number, a letter, or a capitalized title. Pay close attention to the document's structure to correctly separate each clause.

  Document Text:
  {{{documentText}}}`,
});

const identifyClausesFlow = ai.defineFlow(
  {
    name: 'identifyClausesFlow',
    inputSchema: IdentifyClausesInputSchema,
    outputSchema: IdentifyClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
