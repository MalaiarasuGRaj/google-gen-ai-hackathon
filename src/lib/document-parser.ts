'use server';

import pdf from 'pdf-parse';
import * as docx from 'docx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);
  return data.text;
}

async function extractTextFromDocx(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const doc = await docx.Importer.load(buffer);
    const text: string[] = [];
    
    doc.paragraphs.forEach(p => {
        text.push(p.text);
    });

    return text.join('\n\n');
}

async function extractTextFromTxt(file: File): Promise<string> {
  return file.text();
}

export async function extractText(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      try {
        return await extractTextFromPdf(file);
      } catch (error) {
          throw new Error('Could not extract text from the PDF. Please check your file format.');
      }
    case 'docx':
        try {
            return await extractTextFromDocx(file);
        } catch (error) {
            throw new Error('Could not extract text from the DOCX. Please check your file format.');
        }
    case 'txt':
      return await extractTextFromTxt(file);
    default:
      throw new Error('Unsupported file type. Only PDF, DOCX, or TXT files are allowed.');
  }
}
