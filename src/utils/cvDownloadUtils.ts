import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function downloadCVAsPDF(
  elementId: string,
  fileName: string = 'resume.pdf'
) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('CV element not found');
    }

    // Convert the DOM element to a canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Get dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF (handle multiple pages if needed)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function generateCVPreview(elementId: string): Promise<string> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('CV element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
}
