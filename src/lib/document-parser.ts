'use server';

import pdf from 'pdf-parse/lib/pdf-parse.js';
import * as docx from 'docx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Custom PDF text renderer to preserve paragraphs
async function renderPageWithLayout(pageData: any): Promise<string> {
    const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
    };

    const textContent = await pageData.getTextContent(renderOptions);
    let lastY: number | null = null;
    let text = '';
    // Sort items by their vertical and then horizontal position
    const sortedItems = textContent.items.sort((a: any, b: any) => {
      if (a.transform[5] < b.transform[5]) return 1;
      if (a.transform[5] > b.transform[5]) return -1;
      if (a.transform[4] < b.transform[4]) return -1;
      if (a.transform[4] > b.transform[4]) return 1;
      return 0;
    });

    for (const item of sortedItems) {
        if (lastY !== null) {
            // A large vertical gap likely indicates a new paragraph
            if (item.str.trim() && Math.abs(lastY - item.transform[5]) > item.height * 1.5) {
                text += '\n\n';
            } else if (!item.str.trim() && item.height > 0) {
                 // Attempt to preserve line breaks from empty lines
                 text += '\n';
            } else {
                 text += ' ';
            }
        }
        text += item.str;
        lastY = item.transform[5];
    }
    return text.replace(/\s*\n\s*/g, '\n\n').trim();
}


async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer, {
    pagerender: renderPageWithLayout
  });
  return data.text;
}

async function extractTextFromDocx(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const doc = await docx.Importer.load(buffer);
    const paragraphs = doc.getParagraphs();
    return paragraphs.map(p => p.getTextRun().map(r => r.text).join('')).join('\n\n');
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
          console.error(error);
          throw new Error('Could not extract text from the PDF. Please check your file format.');
      }
    case 'docx':
        try {
            return await extractTextFromDocx(file);
        } catch (error) {
            console.error(error);
            throw new Error('Could not extract text from the DOCX. Please check your file format.');
        }
    case 'txt':
      return await extractTextFromTxt(file);
    default:
      throw new Error('Unsupported file type. Only PDF, DOCX, or TXT files are allowed.');
  }
}
