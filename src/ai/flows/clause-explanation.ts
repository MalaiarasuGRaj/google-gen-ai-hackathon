// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Provides simplified explanations and a risk score for legal document clauses.
 *
 * - explainClause - A function that handles the clause explanation process.
 * - ExplainClauseInput - The input type for the explainClause function.
 * - ExplainClauseOutput - The return type for the explainClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainClauseInputSchema = z.object({
  clause: z.string().describe('The legal clause to be explained.'),
});
export type ExplainClauseInput = z.infer<typeof ExplainClauseInputSchema>;

const ExplainClauseOutputSchema = z.object({
  explanation: z.string().describe('A simplified explanation of the clause.'),
  riskScore: z
    .enum(['Low', 'Medium', 'High'])
    .describe('A risk score indicating the user obligations.'),
});
export type ExplainClauseOutput = z.infer<typeof ExplainClauseOutputSchema>;

export async function explainClause(input: ExplainClauseInput): Promise<ExplainClauseOutput> {
  return explainClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainClausePrompt',
  input: {schema: ExplainClauseInputSchema},
  output: {schema: ExplainClauseOutputSchema},
  prompt: `You are a legal expert simplifying legal clauses for laypersons.

  Provide a simplified explanation of the following clause and assign a risk score (Low, Medium, High) indicating the user's obligations.

  Clause: {{{clause}}}`,
});

const explainClauseFlow = ai.defineFlow(
  {
    name: 'explainClauseFlow',
    inputSchema: ExplainClauseInputSchema,
    outputSchema: ExplainClauseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
