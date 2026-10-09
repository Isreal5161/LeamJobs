import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { CVData, CVTemplateId } from '../components/cv-templates/CVTemplateRenderer';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 9;
const CSS_PIXELS_PER_MM = 96 / 25.4;
const EXPORT_SCALE = 2;

function waitForImages(element: HTMLElement): Promise<void> {
  return Promise.all(Array.from(element.querySelectorAll('img')).map(async (image) => {
    if (!image.complete) {
      await new Promise<void>((resolve, reject) => {
        const loaded = () => {
          cleanup();
          resolve();
        };
        const failed = () => {
          cleanup();
          reject(new Error('A CV image could not be loaded.'));
        };
        const cleanup = () => {
          image.removeEventListener('load', loaded);
          image.removeEventListener('error', failed);
        };
        image.addEventListener('load', loaded, { once: true });
        image.addEventListener('error', failed, { once: true });
        if (image.complete) {
          if (image.naturalWidth > 0) loaded();
          else failed();
        }
      });
    }

    if (image.currentSrc && image.naturalWidth === 0) {
      throw new Error('A CV image could not be loaded.');
    }

    if (image.decode) await image.decode();
  })).then(() => undefined);
}

function getPageBreaks(root: HTMLElement, contentHeight: number, pageHeight: number): number[] {
  const rootTop = root.getBoundingClientRect().top;
  const keepTogether = Array.from(root.querySelectorAll<HTMLElement>(
    '.cv-entry, .cv-creative__entry, .cv-executive__entry, .cv-ats article, .cv-compact article, .cv-pdf-keep-together',
  )).map((entry) => {
    const rect = entry.getBoundingClientRect();
    return { top: rect.top - rootTop, bottom: rect.bottom - rootTop };
  });
  const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3')).flatMap((heading) => {
    const followingContent = heading.nextElementSibling;
    if (!(followingContent instanceof HTMLElement)) return [];
    const headingRect = heading.getBoundingClientRect();
    const contentRect = followingContent.getBoundingClientRect();
    return [{
      top: headingRect.top - rootTop,
      bottom: contentRect.bottom - rootTop,
    }];
  });
  const breaks: number[] = [];
  let pageStart = 0;

  while (contentHeight - pageStart > pageHeight + 1) {
    const target = pageStart + pageHeight;
    let pageEnd = target;
    const crossingEntry = keepTogether.find((entry) => entry.top < target && entry.bottom > target);
    const crossingHeading = headings.find((heading) => heading.top < target && heading.bottom > target);

    for (const block of [crossingEntry, crossingHeading]) {
      if (block && block.top - pageStart >= pageHeight * 0.55) {
        pageEnd = Math.min(pageEnd, block.top);
      }
    }

    if (pageEnd <= pageStart + 1) pageEnd = target;
    breaks.push(pageEnd);
    pageStart = pageEnd;
  }

  breaks.push(contentHeight);
  return breaks;
}

function createPageCanvas(source: HTMLCanvasElement, top: number, bottom: number): HTMLCanvasElement {
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = source.width;
  pageCanvas.height = Math.max(1, bottom - top);
  const context = pageCanvas.getContext('2d');
  if (!context) throw new Error('Could not prepare a page for the CV PDF.');
  context.drawImage(source, 0, top, source.width, pageCanvas.height, 0, 0, source.width, pageCanvas.height);
  return pageCanvas;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[. ]+$/g, '')
    .slice(0, 120);
  const baseName = cleaned || 'resume';
  return /\.pdf$/i.test(baseName) ? baseName : `${baseName}.pdf`;
}

export function createCvFileName(name: string, extension: 'pdf' | 'docx' | 'txt'): string {
  const baseName = name
    .replace(/\.(pdf|docx)$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[. ]+$/g, '')
    .replace(/^[. ]+/g, '')
    .slice(0, 120) || 'resume';
  return `${baseName}-CV.${extension}`;
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type DocxTheme = {
  accent: string;
  title: string;
  bodyFont: string;
  headingFont: string;
  centeredHeader?: boolean;
};

const DOCX_THEMES: Record<CVTemplateId, DocxTheme> = {
  modern: { accent: '2563EB', title: '172554', bodyFont: 'Aptos', headingFont: 'Aptos Display' },
  professional: { accent: '2C3E50', title: '2C3E50', bodyFont: 'Georgia', headingFont: 'Georgia', centeredHeader: true },
  creative: { accent: '764BA2', title: '5B3A91', bodyFont: 'Aptos', headingFont: 'Aptos Display' },
  minimalist: { accent: '666666', title: '333333', bodyFont: 'Aptos', headingFont: 'Aptos' },
  executive: { accent: '16324F', title: '16324F', bodyFont: 'Georgia', headingFont: 'Arial' },
  ats: { accent: '1F2937', title: '111827', bodyFont: 'Arial', headingFont: 'Arial' },
  compact: { accent: '263238', title: '263238', bodyFont: 'Arial', headingFont: 'Arial' },
};

function addDocxSectionHeading(title: string, theme: DocxTheme): Paragraph {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 260, after: 100 },
    border: {
      bottom: {
        color: theme.accent,
        style: 'single',
        size: 8,
        space: 4,
      },
    },
    run: {
      font: theme.headingFont,
      size: 23,
      bold: true,
      color: theme.accent,
    },
  });
}

function addDocxEntryHeading(
  title: string,
  date: string,
  theme: DocxTheme,
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: title, bold: true, color: theme.title }),
      ...(date ? [new TextRun({ text: `    ${date}`, color: '64748B' })] : []),
    ],
    keepNext: true,
    spacing: { before: 140, after: 30 },
  });
}

function addDocxBody(text: string, theme: DocxTheme, options: { italic?: boolean; after?: number } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: theme.bodyFont,
      size: 20,
      color: '334155',
      italics: options.italic,
    })],
    spacing: { after: options.after ?? 90, line: 276 },
    widowControl: true,
  });
}

function addDocxUrl(label: string, url: string, theme: DocxTheme): Paragraph {
  const children: (TextRun | ExternalHyperlink)[] = [new TextRun({
    text: `${label}: `,
    font: theme.bodyFont,
    size: 20,
    color: '334155',
  })];
  if (/^https?:\/\//i.test(url)) {
    children.push(new ExternalHyperlink({
      link: url,
      children: [new TextRun({ text: url, style: 'Hyperlink' })],
    }));
  } else {
    children.push(new TextRun({ text: url, font: theme.bodyFont, size: 20, color: '334155' }));
  }
  return new Paragraph({ children, spacing: { after: 90, line: 276 } });
}

function buildCvDocxParagraphs(data: CVData, template: CVTemplateId): Paragraph[] {
  const theme = DOCX_THEMES[template];
  const paragraphs: Paragraph[] = [];
  const contact = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
  ].filter((value): value is string => Boolean(value?.trim()));
  if (data.personalInfo.fullName.trim()) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({
      text: data.personalInfo.fullName,
      font: theme.headingFont,
      size: 38,
      bold: true,
      color: theme.title,
      })],
      alignment: theme.centeredHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 60 },
      keepNext: true,
    }));
  }

  if (data.personalInfo.title.trim()) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.personalInfo.title, font: theme.bodyFont, size: 24, color: theme.accent, bold: true })],
      alignment: theme.centeredHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 90 },
      keepNext: contact.length > 0,
    }));
  }
  if (contact.length > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: contact.join('  |  '), font: theme.bodyFont, size: 18, color: '64748B' })],
      alignment: theme.centeredHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 180 },
    }));
  }

  const addSection = (title: string, content: Paragraph[]) => {
    if (content.length === 0) return;
    paragraphs.push(addDocxSectionHeading(title, theme), ...content);
  };

  const summary = data.summary?.trim();
  const experience = data.experience.flatMap((item) => {
    const date = [item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ');
    const title = [item.jobTitle, item.company].filter((value) => Boolean(value.trim())).join(' — ');
    const entry = [
      ...(title ? [addDocxEntryHeading(title, date, theme)] : date ? [addDocxBody(date, theme, { italic: true, after: 40 })] : []),
      ...(item.description.trim() ? [addDocxBody(item.description, theme)] : []),
    ];
    return item.jobTitle.trim() || item.company.trim() || item.description.trim() ? entry : [];
  });
  const education = data.education.flatMap((item) => {
    const details = [
      item.school,
      item.year,
      item.details,
    ].filter((value): value is string => Boolean(value?.trim()));
    const title = item.degree.trim() || item.school.trim();
    return title || details.length
      ? [...(title ? [addDocxEntryHeading(title, '', theme)] : []), ...(details.length ? [addDocxBody(details.filter((value) => value.trim() !== title).join(' · '), theme)] : [])]
      : [];
  });
  const skills = data.skills.filter((skill) => skill.trim());
  const certifications = data.certifications.flatMap((item) => {
    const detail = [item.name, item.issuer].filter(Boolean).join(' — ');
    return detail ? [addDocxBody(detail, theme)] : [];
  });
  const links = [
    data.personalInfo.website?.trim() ? addDocxUrl('Website', data.personalInfo.website, theme) : null,
    data.personalInfo.linkedin?.trim() ? addDocxUrl('LinkedIn', data.personalInfo.linkedin, theme) : null,
  ].filter((paragraph): paragraph is Paragraph => paragraph !== null);
  const languages = (data.languages ?? []).flatMap((item) => {
    const value = [item.name, item.proficiency].filter(Boolean).join(' — ');
    return value ? [addDocxBody(value, theme)] : [];
  });
  const projects = (data.projects ?? []).flatMap((item) => {
    const title = item.name.trim();
    const date = [item.startDate, item.endDate].filter(Boolean).join(' - ');
    const details = [
      item.description,
      item.technologies.length ? `Technologies: ${item.technologies.join(', ')}` : '',
    ].filter((value): value is string => Boolean(value?.trim()));
    const content = [
      ...(title ? [addDocxEntryHeading(title, date, theme)] : date ? [addDocxBody(date, theme, { italic: true, after: 40 })] : []),
      ...details.map((detail) => addDocxBody(detail, theme)),
      ...(item.projectUrl.trim() ? [addDocxUrl('Project', item.projectUrl, theme)] : []),
      ...(item.githubUrl.trim() ? [addDocxUrl('GitHub', item.githubUrl, theme)] : []),
    ];
    return content;
  });

  const sections: Record<string, Paragraph[]> = {
    summary: summary ? [addDocxBody(summary, theme)] : [],
    experience,
    education,
    skills: skills.length ? [addDocxBody(skills.join('  •  '), theme)] : [],
    certifications,
    links,
    languages,
    projects,
  };

  const orderByTemplate: Record<CVTemplateId, string[]> = {
    modern: ['skills', 'certifications', 'summary', 'experience', 'education', 'links', 'languages', 'projects'],
    professional: ['summary', 'experience', 'education', 'skills', 'certifications', 'links', 'languages', 'projects'],
    creative: ['summary', 'links', 'languages', 'projects', 'experience', 'skills', 'education', 'certifications'],
    minimalist: ['summary', 'experience', 'education', 'skills', 'certifications', 'links', 'languages', 'projects'],
    executive: ['summary', 'experience', 'education', 'skills', 'certifications', 'links', 'languages', 'projects'],
    ats: ['summary', 'experience', 'education', 'skills', 'certifications', 'links', 'languages', 'projects'],
    compact: ['summary', 'experience', 'education', 'skills', 'certifications', 'links', 'languages', 'projects'],
  };
  const labels: Record<string, string> = {
    summary: 'Professional Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
    links: 'Links',
    languages: 'Languages',
    projects: 'Projects',
  };

  orderByTemplate[template].forEach((key) => addSection(labels[key], sections[key]));
  return paragraphs;
}

export async function downloadCVAsDOCX(
  data: CVData,
  template: CVTemplateId,
  fileName: string,
): Promise<void> {
  const theme = DOCX_THEMES[template];
  const paragraphs = buildCvDocxParagraphs(data, template);
  const docxDocument = new Document({
    creator: 'LeamJobs',
    title: `${data.personalInfo.fullName || 'CV'} - Curriculum Vitae`,
    styles: {
      default: {
        document: {
          run: { font: theme.bodyFont, size: 20, color: '334155' },
          paragraph: { spacing: { after: 90, line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: paragraphs,
    }],
  });
  const blob = await Packer.toBlob(docxDocument);
  triggerBlobDownload(blob, createCvFileName(fileName, 'docx'));
}

export function downloadCVAsText(data: CVData, fileName: string): void {
  const lines = [
    data.personalInfo.fullName,
    data.personalInfo.title,
    [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join(' | '),
    '',
  ].filter((line, index) => line || index === 3);
  const addSection = (title: string, entries: string[]) => {
    if (entries.length === 0) return;
    lines.push(title.toUpperCase(), ...entries, '');
  };

  addSection('Professional Summary', data.summary?.trim() ? [data.summary.trim()] : []);
  addSection('Experience', data.experience.flatMap((item) => {
    const title = [item.jobTitle, item.company].filter(Boolean).join(' — ');
    const dates = [item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ');
    const details = [title, dates, item.description].filter((value) => Boolean(value?.trim()));
    return details.length ? [details.join('\n')] : [];
  }));
  addSection('Education', data.education.flatMap((item) => {
    const details = [item.degree, item.school, item.year, item.details].filter((value) => Boolean(value?.trim()));
    return details.length ? [details.join('\n')] : [];
  }));
  addSection('Skills', data.skills.filter((skill) => skill.trim()).length ? [data.skills.filter((skill) => skill.trim()).join(', ')] : []);
  addSection('Certifications', data.certifications.flatMap((item) => {
    const value = [item.name, item.issuer].filter(Boolean).join(' — ');
    return value ? [value] : [];
  }));
  addSection('Links', [
    data.personalInfo.website ? `Website: ${data.personalInfo.website}` : '',
    data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin}` : '',
  ].filter(Boolean));
  addSection('Languages', (data.languages ?? []).flatMap((item) => {
    const value = [item.name, item.proficiency].filter(Boolean).join(' — ');
    return value ? [value] : [];
  }));
  addSection('Projects', (data.projects ?? []).flatMap((item) => {
    const entry = [
      [item.name, [item.startDate, item.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' — '),
      item.description,
      item.technologies.length ? `Technologies: ${item.technologies.join(', ')}` : '',
      item.projectUrl,
      item.githubUrl,
    ].filter((value) => Boolean(value?.trim()));
    return entry.length ? [entry.join('\n')] : [];
  }));

  triggerBlobDownload(
    new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }),
    createCvFileName(fileName, 'txt'),
  );
}

export async function downloadCVAsPDF(
  elementId: string,
  fileName: string = 'resume.pdf',
): Promise<void> {
  const source = document.getElementById(elementId);
  if (!(source instanceof HTMLElement)) {
    throw new Error('The CV preview is not available for export.');
  }

  const pageContentWidthMm = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const pageContentHeightMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const exportWidth = pageContentWidthMm * CSS_PIXELS_PER_MM;
  const exportRoot = source.cloneNode(true) as HTMLElement;
  const exportMount = document.createElement('div');
  exportMount.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    `width:${exportWidth}px`,
    'height:auto',
    'z-index:-1',
    'visibility:hidden',
    'pointer-events:none',
    'background:#ffffff',
  ].join(';');
  exportMount.dataset.cvPdfExport = 'true';
  exportRoot.id = 'cv-pdf-export-source';
  exportRoot.style.setProperty('width', `${exportWidth}px`, 'important');
  exportRoot.style.setProperty('height', 'auto', 'important');
  exportRoot.style.setProperty('max-height', 'none', 'important');
  exportRoot.style.setProperty('min-height', '0', 'important');
  exportRoot.style.setProperty('overflow', 'visible', 'important');
  exportRoot.style.setProperty('border', '0', 'important');
  exportRoot.style.setProperty('border-radius', '0', 'important');
  exportRoot.style.setProperty('padding', '0', 'important');
  exportRoot.querySelector<HTMLElement>('.cv-modern')?.style.setProperty('min-height', '0', 'important');
  exportMount.append(exportRoot);
  document.body.append(exportMount);

  try {
    await document.fonts.ready;
    await waitForImages(exportRoot);

    const rootRect = exportRoot.getBoundingClientRect();
    const contentHeight = Math.max(exportRoot.scrollHeight, exportRoot.offsetHeight);
    if (rootRect.width <= 0 || contentHeight <= 0) {
      throw new Error('The CV preview has no printable content.');
    }

    const canvas = await html2canvas(exportRoot, {
      scale: EXPORT_SCALE,
      width: exportWidth,
      windowWidth: Math.max(794, Math.ceil(exportWidth)),
      windowHeight: Math.max(window.innerHeight, 1000),
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDocument) => {
        const clonedMount = clonedDocument.querySelector<HTMLElement>('[data-cv-pdf-export="true"]');
        if (clonedMount) clonedMount.style.visibility = 'visible';
      },
    });

    const pixelsPerCssPixel = canvas.width / rootRect.width;
    const pageHeightCss = pageContentHeightMm * CSS_PIXELS_PER_MM;
    const pageBreaks = getPageBreaks(exportRoot, canvas.height / pixelsPerCssPixel, pageHeightCss);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let pageTop = 0;

    for (const pageBottom of pageBreaks) {
      const topPx = Math.round(pageTop * pixelsPerCssPixel);
      const bottomPx = Math.min(canvas.height, Math.round(pageBottom * pixelsPerCssPixel));
      if (bottomPx <= topPx) continue;

      if (pageTop > 0) pdf.addPage();
      const pageCanvas = createPageCanvas(canvas, topPx, bottomPx);
      const imageHeightMm = pageCanvas.height / pageCanvas.width * pageContentWidthMm;
      pdf.addImage(
        pageCanvas.toDataURL('image/jpeg', 0.97),
        'JPEG',
        PAGE_MARGIN_MM,
        PAGE_MARGIN_MM,
        pageContentWidthMm,
        Math.min(imageHeightMm, pageContentHeightMm),
      );
      pageTop = pageBottom;
    }

    pdf.save(sanitizeFileName(createCvFileName(fileName, 'pdf')));
  } finally {
    exportMount.remove();
  }
}

export async function generateCVPreview(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!(element instanceof HTMLElement)) {
    throw new Error('CV element not found');
  }

  await document.fonts.ready;
  await waitForImages(element);
  const canvas = await html2canvas(element, {
    scale: 1,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  return canvas.toDataURL('image/png');
}
