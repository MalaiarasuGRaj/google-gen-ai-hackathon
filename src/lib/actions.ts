'use server';

import { z } from 'zod';
import { smartSummarization, SmartSummarizationInput, SmartSummarizationOutput } from '@/ai/flows/smart-summarization';
import { explainClause, ExplainClauseInput, ExplainClauseOutput } from '@/ai/flows/clause-explanation';
import { interactiveQA, InteractiveQAInput, InteractiveQAOutput } from '@/ai/flows/interactive-qa';

// Re-export types for client-side usage
export type { SmartSummarizationOutput, ExplainClauseOutput, InteractiveQAOutput };

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const generateSummarySchema = z.object({
  documentText: z.string().min(1, 'Document text cannot be empty.'),
});

export async function generateSummaryAction(
  data: SmartSummarizationInput
): Promise<ActionResult<SmartSummarizationOutput>> {
  const validation = generateSummarySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  try {
    const result = await smartSummarization(validation.data);
    return { success: true, data: result };
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
