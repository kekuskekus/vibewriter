import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EXPORTS_PATH, sanitizeFileName } from '../utils/storage.js';
import { createOdt } from '../utils/odt.js';

export class ExportService {
  async exportAsMarkdown(
    documentName: string,
    content: string,
    metadata?: { title?: string; createdAt?: string; updatedAt?: string }
  ): Promise<{ path: string; filename: string }> {
    const filename = sanitizeFileName(`${documentName.replace(/\.md$/, '')}.md`);
    const filepath = join(EXPORTS_PATH, filename);

    let mdContent = content;

    // Add frontmatter if metadata provided
    if (metadata?.title || metadata?.createdAt || metadata?.updatedAt) {
      const frontmatter = ['---'];

      if (metadata.title) {
        frontmatter.push(`title: ${metadata.title}`);
      }
      if (metadata.createdAt) {
        frontmatter.push(`created_at: ${metadata.createdAt}`);
      }
      if (metadata.updatedAt) {
        frontmatter.push(`updated_at: ${metadata.updatedAt}`);
      }

      frontmatter.push('source_app: FocusWriter');
      frontmatter.push('---');
      frontmatter.push('');

      mdContent = frontmatter.join('\n') + mdContent;
    }

    await writeFile(filepath, mdContent, 'utf-8');

    return {
      path: filepath,
      filename,
    };
  }

  async exportAsOdt(
    documentName: string,
    content: string,
    metadata?: { title?: string; createdAt?: string; updatedAt?: string }
  ): Promise<{ path: string; filename: string }> {
    const filename = sanitizeFileName(`${documentName.replace(/\.md$/, '')}.odt`);
    const filepath = join(EXPORTS_PATH, filename);

    const odtBuffer = await createOdt(
      content,
      metadata?.title || documentName.replace(/\.md$/, '')
    );
    await writeFile(filepath, odtBuffer);

    return {
      path: filepath,
      filename,
    };
  }
}

export const exportService = new ExportService();
