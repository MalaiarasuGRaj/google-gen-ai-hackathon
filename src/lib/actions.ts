
'use server';

import { z } from 'zod';
import { smartSummarization, type SmartSummarizationInput, type SmartSummarizationOutput } from '@/ai/flows/smart-summarization';
import { explainClause, type ExplainClauseInput, type ExplainClauseOutput } from '@/ai/flows/clause-explanation';
import { interactiveQA, type InteractiveQAInput, type InteractiveQAOutput } from '@/ai/flows/interactive-qa';
import { identifyClauses } from '@/ai/flows/identify-clauses';
import { identifyParties, type IdentifyPartiesOutput } from '@/ai/flows/identify-parties';
import { extractText, normalizeText } from './document-parser';
import { validateDocument } from '@/ai/flows/validate-document';

// Re-export types for client-side usage
export type { ExplainClauseOutput, InteractiveQAOutput, SmartSummarizationOutput };

export type ProcessDocumentOutput = {
  documentText: string;
  parties: IdentifyPartiesOutput;
  clauses: string[];
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function processDocumentAction(
  formData: FormData
): Promise<ActionResult<ProcessDocumentOutput>> {
  const file = formData.get('file') as File | null;
  const text = formData.get('text') as string | null;
  const language = formData.get('language') as string | undefined;

  let documentText: string;

  try {
    if (file) {
      documentText = await extractText(file);
    } else if (text) {
      documentText = await normalizeText(text);
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
    const { isLegalDoc } = await validateDocument({ documentText });
    if (!isLegalDoc) {
      return { success: false, error: 'The uploaded document does not appear to be a legal document. Please upload a valid legal document.' };
    }

    const [parties, clauseData] = await Promise.all([
      identifyParties({ documentText, language }),
      identifyClauses({ documentText })
    ]);
    
    return { success: true, data: { documentText, parties, clauses: clauseData.clauses } };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred during document analysis.' };
  }
}

const summarizeDocumentSchema = z.object({
  documentText: z.string().min(1, 'Document text cannot be empty.'),
  userRole: z.string().optional(),
  language: z.string().optional(),
});

export async function summarizeDocumentAction(
  data: SmartSummarizationInput
): Promise<ActionResult<SmartSummarizationOutput>> {
  const validation = summarizeDocumentSchema.safeParse(data);
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
  userRole: z.string().optional(),
  language: z.string().optional(),
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
  userRole: z.string().optional(),
  language: z.string().optional(),
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
