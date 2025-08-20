'use server';

import pdf from 'pdf-parse/lib/pdf-parse.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper function to normalize text by preserving paragraphs
export async function normalizeText(text: string): Promise<string> {
    // Replace multiple newlines with a standard double newline for paragraph breaks
    return text.replace(/(\r\n|\r|\n){2,}/g, '\n\n').trim();
}

// Custom PDF text renderer to preserve paragraphs
async function renderPageWithLayout(pageData: any): Promise<string> {
    const renderOptions = {
        normalizeWhitespace: false,
        disableCombineTextItems: false,
    };

    const textContent = await pageData.getTextContent(renderOptions);
    let lastY: number | null = null;
    let lastX: number | null = null;
    let lastFont: string | null = null;
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
        const currentY = item.transform[5];
        const currentX = item.transform[4];
        const currentFont = item.fontName;

        if (lastY !== null && lastX !== null) {
            const yDiff = Math.abs(lastY - currentY);
            const xDiff = currentX - lastX;
            const fontChanged = lastFont !== currentFont;

            // A large vertical gap, a new line with no indent, or a font change often indicates a new paragraph
            if (yDiff > item.height * 1.5 || (xDiff < -5 && yDiff > item.height * 0.5) || (fontChanged && yDiff > item.height)) {
                text += '\n\n';
            } else if (yDiff > item.height * 0.5) { // Smaller gap might just be a new line
                text += '\n';
            } else if (xDiff > item.width) { // A horizontal gap is likely a space
                text += ' ';
            }
        }
        
        text += item.str;
        lastY = currentY;
        lastX = currentX;
        lastFont = currentFont;
    }
    return normalizeText(text);
}

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer, {
    pagerender: renderPageWithLayout
  });
  return data.text;
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
    default:
      throw new Error('Unsupported file type. Only PDF files are allowed.');
  }
}
