export function createCvFileName(name, extension) {
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
