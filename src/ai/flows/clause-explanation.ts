
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
  userRole: z.string().optional().describe('The user\'s role in the document (e.g., tenant, licensor).'),
  language: z.string().optional().describe('The language for the output (e.g., "Hindi", "Tamil"). Defaults to English if not provided.'),
});
export type ExplainClauseInput = z.infer<typeof ExplainClauseInputSchema>;

const ExplainClauseOutputSchema = z.object({
  explanation: z.string().describe('A simplified explanation of the clause.'),
  riskScore: z
    .enum(['Low', 'Medium', 'High'])
    .describe('A risk score indicating the user obligations.'),
  negotiationSuggestions: z.array(z.string()).describe('Concrete suggestions for negotiation, including alternative wording or questions to ask.'),
});
export type ExplainClauseOutput = z.infer<typeof ExplainClauseOutputSchema>;

export async function explainClause(input: ExplainClauseInput): Promise<ExplainClauseOutput> {
  return explainClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainClausePrompt',
  input: {schema: ExplainClauseInputSchema},
  output: {schema: ExplainClauseOutputSchema},
  prompt: `You are a legal expert simplifying legal clauses for a layperson. The user's role in this document is: **{{#if userRole}}{{userRole}}{{else}}one of the parties{{/if}}**. All analysis should be from their perspective.

  The user has requested the output in the following language: **{{#if language}}{{language}}{{else}}English{{/if}}**. All of your generated response must be in this language.

  For the following clause, provide:
  1. A simplified explanation of what this means *for the user*.
  2. A risk score (Low, Medium, High) indicating the user's obligations and potential risks.
  3. Actionable negotiation suggestions *for the user*. If the risk is Medium or High, suggest alternative, more favorable wording or specific questions the user should ask to clarify ambiguity and reduce their risk. If the risk is Low, your suggestion should be a single, very short sentence stating that no changes are likely needed from their perspective.

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
