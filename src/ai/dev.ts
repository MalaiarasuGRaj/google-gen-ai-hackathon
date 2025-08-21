
import { config } from 'dotenv';
config();

import '@/ai/flows/interactive-qa.ts';
import '@/ai/flows/clause-explanation.ts';
import '@/ai/flows/smart-summarization.ts';
import '@/ai/flows/identify-clauses.ts';
import '@/ai/flows/identify-parties.ts';
import '@/ai/flows/validate-document.ts';
