'use server';

import { z } from 'zod';
import { smartSummarization, SmartSummarizationInput, SmartSummarizationOutput } from '@/ai/flows/smart-summarization';
import { explainClause, ExplainClauseInput, ExplainClauseOutput } from '@/ai/flows/clause-explanation';
import { interactiveQA, InteractiveQAInput, InteractiveQAOutput } from '@/ai/flows/interactive-qa';
import { extractText } from './document-parser';

// Re-export types for client-side usage
export type { ExplainClauseOutput, InteractiveQAOutput };

export type ProcessDocumentOutput = {
  documentText: string;
  summary: SmartSummarizationOutput;
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function processDocumentAction(
  formData: FormData
): Promise<ActionResult<ProcessDocumentOutput>> {
  const file = formData.get('file') as File | null;
  const text = formData.get('text') as string | null;

  let documentText: string;

  try {
    if (file) {
      documentText = await extractText(file);
    } else if (text) {
      documentText = text;
    } else {
      return { success: false, error: 'No file or text provided.' };
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred during parsing.';
    console.error(e);
    return { success: false, error };
  }
  
  if (!documentText.trim()) {
    return { success: false, error: 'Document text is empty.' };
  }

  try {
    const summary = await smartSummarization({ documentText });
    return { success: true, data: { documentText, summary } };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred during summarization.' };
  }
}

const explainClauseSchema = z.object({
  clause: z.string().min(1, 'Clause cannot be empty.'),
});

export async function explainClauseAction(
  data: ExplainClauseInput
): Promise<ActionResult<ExplainClauseOutput>> {
  const validation = explainClauseSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  try {
    const result = await explainClause(validation.data);
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred during clause explanation.' };
  }
}

const askQuestionSchema = z.object({
  documentContent: z.string().min(1, 'Document content cannot be empty.'),
  question: z.string().min(1, 'Question cannot be empty.'),
});

export async function askQuestionAction(
  data: InteractiveQAInput
): Promise<ActionResult<InteractiveQAOutput>> {
  const validation = askQuestionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  try {
    const result = await interactiveQA(validation.data);
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred while getting the answer.' };
  }
}
