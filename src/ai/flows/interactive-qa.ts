'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering user questions about a legal document.
 *
 * - interactiveQA - A function that takes a document and a question and returns an answer.
 * - InteractiveQAInput - The input type for the interactiveQA function.
 * - InteractiveQAOutput - The return type for the interactiveQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractiveQAInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the legal document to ask questions about.'),
  question: z.string().describe('The question to ask about the document.'),
});
export type InteractiveQAInput = z.infer<typeof InteractiveQAInputSchema>;

const InteractiveQAOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the document.'),
});
export type InteractiveQAOutput = z.infer<typeof InteractiveQAOutputSchema>;

export async function interactiveQA(input: InteractiveQAInput): Promise<InteractiveQAOutput> {
  return interactiveQAFlow(input);
}

const interactiveQAPrompt = ai.definePrompt({
  name: 'interactiveQAPrompt',
  input: {schema: InteractiveQAInputSchema},
  output: {schema: InteractiveQAOutputSchema},
  prompt: `You are an expert legal assistant. You will answer questions about legal documents.

  Here is the document:
  {{documentContent}}

  Question: {{question}}

  Answer: `,
});

const interactiveQAFlow = ai.defineFlow(
  {
    name: 'interactiveQAFlow',
    inputSchema: InteractiveQAInputSchema,
    outputSchema: InteractiveQAOutputSchema,
  },
  async input => {
    const {output} = await interactiveQAPrompt(input);
    return output!;
  }
);
