import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';

// Create a minimal valid ODT file (which is a ZIP with specific structure)
export async function createOdt(content: string, title: string): Promise<Buffer> {
  // For MVP, we create a minimal ODT structure manually
  // ODT is a ZIP file with specific XML files inside

  const tempDir = join(tmpdir(), `odt-${Date.now()}`);

  try {
    await mkdir(tempDir, { recursive: true });

    // Create MIME type file (must be first, uncompressed)
    const mimetypeContent = 'application/vnd.oasis.opendocument.text';
    await writeFile(join(tempDir, 'mimetype'), mimetypeContent);

    // Create META-INF directory
    await mkdir(join(tempDir, 'META-INF'), { recursive: true });

    // Create container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.xml" media-type="application/vnd.oasis.opendocument.text"/>
  </rootfiles>
</container>`;
    await writeFile(join(tempDir, 'META-INF', 'container.xml'), containerXml);

    // Escape content for XML
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n')
      .map((line) => `    <text:p>${line || '<text:span/>'}</text:p>`)
      .join('\n');

    // Create content.xml
    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  office:version="1.2">
  <office:meta>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:date>${new Date().toISOString()}</dc:date>
  </office:meta>
  <office:body>
    <office:text>
${escapedContent}
    </office:text>
  </office:body>
</office:document>`;

    await writeFile(join(tempDir, 'content.xml'), contentXml);

    // Create styles.xml (minimal)
    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.2">
</office:document-styles>`;

    await writeFile(join(tempDir, 'styles.xml'), stylesXml);

    // Create settings.xml (minimal)
    const settingsXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  office:version="1.2">
</office:document-settings>`;

    await writeFile(join(tempDir, 'settings.xml'), settingsXml);

    // Create META-INF/manifest.xml
    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="META-INF/manifest.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    await writeFile(join(tempDir, 'META-INF', 'manifest.xml'), manifestXml);

    // Now zip everything. We'll use a simple approach: create zip using system zip command
    // If zip is not available, we'll use a fallback
    const outputPath = join(tempDir, 'output.odt');

    try {
      // Try using system zip command (works on Linux/Mac)
      execSync(
        `cd "${tempDir}" && zip -0 -X "${outputPath}" mimetype && zip -r "${outputPath}" . -x "*.odt" "mimetype"`,
        { stdio: 'pipe' }
      );
    } catch {
      // Fallback: use archiver if available, or create minimal zip manually
      console.warn('System zip not available, attempting fallback...');

      // Manual minimal zip creation
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // Add mimetype first (uncompressed)
      zip.addFile('mimetype', Buffer.from(mimetypeContent), '', 0);

      // Add other files
      const files = [
        'content.xml',
        'styles.xml',
        'settings.xml',
        'META-INF/container.xml',
        'META-INF/manifest.xml',
      ];

      for (const file of files) {
        const content = await readFile(join(tempDir, file), 'utf-8');
        zip.addFile(file, Buffer.from(content), '', 0);
      }

      zip.writeZip(outputPath);
    }

    const buffer = await readFile(outputPath);
    return buffer;
  } finally {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
