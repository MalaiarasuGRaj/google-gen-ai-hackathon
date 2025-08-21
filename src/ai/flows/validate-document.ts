
'use server';

/**
 * @fileOverview Validates whether a given document is a legal document.
 *
 * - validateDocument - A function that handles the document validation process.
 * - ValidateDocumentInput - The input type for the validateDocument function.
 * - ValidateDocumentOutput - The return type for the validateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateDocumentInputSchema = z.object({
  documentText: z
    .string()
    .describe('The full text of the document to be validated.'),
});
export type ValidateDocumentInput = z.infer<typeof ValidateDocumentInputSchema>;

const ValidateDocumentOutputSchema = z.object({
  isLegalDoc: z.boolean().describe('Whether or not the document is a legal document.'),
});
export type ValidateDocumentOutput = z.infer<typeof ValidateDocumentOutputSchema>;

export async function validateDocument(input: ValidateDocumentInput): Promise<ValidateDocumentOutput> {
  return validateDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateDocumentPrompt',
  input: {schema: ValidateDocumentInputSchema},
  output: {schema: ValidateDocumentOutputSchema},
  prompt: `You are a document classifier. Your task is to determine if the provided text is a legal document.

  A legal document typically contains specific elements such as:
  - Clearly defined parties (e.g., "Landlord" and "Tenant", "Company" and "Employee").
  - Numbered or lettered clauses and sections.
  - Formal language, definitions, and specific legal terminology.
  - Signatures, dates, and witness sections.
  - Phrases like "This Agreement," "whereas," "in witness whereof."

  Review the document text and determine if it has these characteristics. Content like resumes, articles, stories, or general correspondence are not legal documents.

  Set \`isLegalDoc\` to \`true\` if it is a legal document, and \`false\` otherwise.

  Document Text:
  {{{documentText}}}`,
});

const validateDocumentFlow = ai.defineFlow(
  {
    name: 'validateDocumentFlow',
    inputSchema: ValidateDocumentInputSchema,
    outputSchema: ValidateDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
