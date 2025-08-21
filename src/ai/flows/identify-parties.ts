'use server';

/**
 * @fileOverview Identifies the two primary parties in a legal document.
 *
 * - identifyParties - A function that handles the party identification process.
 * - IdentifyPartiesInput - The input type for the identifyParties function.
 * - IdentifyPartiesOutput - The return type for the identifyParties function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPartiesInputSchema = z.object({
  documentText: z
    .string()
    .describe('The full text of the legal document.'),
});
export type IdentifyPartiesInput = z.infer<typeof IdentifyPartiesInputSchema>;

const IdentifyPartiesOutputSchema = z.object({
  partyOne: z.string().describe('The name or role of the first party (e.g., Landlord, Licensor).'),
  partyTwo: z.string().describe('The name or role of the second party (e.g., Tenant, Licensee).'),
});
export type IdentifyPartiesOutput = z.infer<typeof IdentifyPartiesOutputSchema>;

export async function identifyParties(input: IdentifyPartiesInput): Promise<IdentifyPartiesOutput> {
  return identifyPartiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPartiesPrompt',
  input: {schema: IdentifyPartiesInputSchema},
  output: {schema: IdentifyPartiesOutputSchema},
  prompt: `You are an expert at parsing legal documents. Your task is to identify the two primary parties involved in the following legal agreement.

  Read the document carefully and determine the roles of the two main entities (e.g., "Landlord" and "Tenant", "Company" and "Employee", "Lender" and "Borrower").

  Document Text:
  {{{documentText}}}`,
});

const identifyPartiesFlow = ai.defineFlow(
  {
    name: 'identifyPartiesFlow',
    inputSchema: IdentifyPartiesInputSchema,
    outputSchema: IdentifyPartiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
