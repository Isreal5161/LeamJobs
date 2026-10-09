import assert from 'node:assert/strict';
import test from 'node:test';
import { inflateRawSync } from 'node:zlib';
import {
  createCvFileName,
  downloadCVAsDOCX,
  downloadCVAsText,
} from '../src/utils/cvDownloadUtils.ts';

function readZipEntry(buffer, requestedName) {
  let endRecord = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65558); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endRecord = offset;
      break;
    }
  }
  assert.notEqual(endRecord, -1, 'zip end-of-directory record exists');
  const entryCount = buffer.readUInt16LE(endRecord + 10);
  let directoryOffset = buffer.readUInt32LE(endRecord + 16);

  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(buffer.readUInt32LE(directoryOffset), 0x02014b50, 'central directory entry exists');
    const method = buffer.readUInt16LE(directoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(directoryOffset + 20);
    const nameLength = buffer.readUInt16LE(directoryOffset + 28);
    const extraLength = buffer.readUInt16LE(directoryOffset + 30);
    const commentLength = buffer.readUInt16LE(directoryOffset + 32);
    const localOffset = buffer.readUInt32LE(directoryOffset + 42);
    const name = buffer.toString('utf8', directoryOffset + 46, directoryOffset + 46 + nameLength);

    if (name === requestedName) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      return method === 0 ? compressed : inflateRawSync(compressed);
    }

    directoryOffset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

async function captureDownload(t, callback) {
  const originalWindow = globalThis.window;
  let download;
  globalThis.window = {
    document: {
      createElement: () => ({
        set href(value) { this.url = value; },
        get href() { return this.url; },
        download: '',
        click() {
          download = { fileName: this.download, url: this.href };
        },
      }),
    },
    setTimeout,
  };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  await callback();
  assert.ok(download, 'export triggered a file download');
  const blob = await fetch(download.url).then((response) => response.blob());
  return { ...download, blob, bytes: Buffer.from(await blob.arrayBuffer()) };
}

const cv = {
  personalInfo: {
    fullName: 'Avery Résumé',
    title: 'Software Engineer',
    email: 'avery@example.test',
    phone: '',
    location: '',
    website: 'https://example.test/portfolio',
    linkedin: 'https://www.linkedin.com/in/avery',
  },
  summary: 'Builds accessible products.',
  experience: [],
  education: [{ degree: 'BSc', school: 'Example University', year: '2021', details: 'Honors' }],
  skills: ['TypeScript'],
  certifications: [],
  languages: [],
  projects: [{
    name: 'Résumé project',
    description: 'A Unicode-friendly project.',
    technologies: ['React'],
    projectUrl: 'https://example.test/project',
    githubUrl: '',
    startDate: '',
    endDate: '',
  }],
};

test('DOCX downloads are valid OOXML packages with populated content and hyperlinks', async (t) => {
  for (const template of ['modern', 'professional', 'creative', 'minimalist', 'executive', 'ats', 'compact']) {
    const { fileName, blob, bytes } = await captureDownload(t, () =>
      downloadCVAsDOCX(cv, template, '../../Avery: Résumé?'));
    assert.equal(fileName, 'Avery-Résumé-CV.docx');
    assert.match(blob.type, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
    assert.equal(bytes.readUInt32LE(0), 0x04034b50, `${template} export is a DOCX ZIP package`);

    const documentXml = readZipEntry(bytes, 'word/document.xml')?.toString('utf8');
    const relationshipsXml = readZipEntry(bytes, 'word/_rels/document.xml.rels')?.toString('utf8');
    assert.ok(documentXml?.includes('Avery Résumé'), `${template} includes the Unicode name`);
    assert.ok(documentXml.includes('Example University'), `${template} includes education details`);
    assert.ok(documentXml.includes('Résumé project'), `${template} includes the project`);
    assert.ok(documentXml.includes('https://example.test/portfolio'), `${template} includes the website`);
    assert.ok(documentXml.includes('<w:hyperlink'), `${template} contains hyperlink elements`);
    assert.ok(relationshipsXml?.includes('https://example.test/portfolio'), `${template} website is clickable`);
    assert.ok(relationshipsXml.includes('https://www.linkedin.com/in/avery'), `${template} LinkedIn is clickable`);
    assert.ok(relationshipsXml.includes('https://example.test/project'), `${template} project URL is clickable`);
  }
});

test('TXT download preserves UTF-8 content and omits empty section headings', async (t) => {
  const { fileName, blob, bytes } = await captureDownload(t, () => downloadCVAsText(cv, 'Avery Résumé'));
  const text = bytes.toString('utf8');
  assert.equal(fileName, 'Avery-Résumé-CV.txt');
  assert.match(blob.type, /text\/plain;charset=utf-8/i);
  assert.ok(text.includes('Avery Résumé'));
  assert.ok(text.includes('Example University'));
  assert.ok(text.includes('https://example.test/portfolio'));
  assert.ok(text.includes('Résumé project'));
  assert.ok(!text.includes('CERTIFICATIONS'));
  assert.ok(!text.includes('LANGUAGES'));
});

test('download filenames remove unsafe path and punctuation characters', () => {
  assert.equal(createCvFileName('../../Avery: Example?', 'pdf'), 'Avery-Example-CV.pdf');
  assert.equal(createCvFileName('   ', 'docx'), 'resume-CV.docx');
});
