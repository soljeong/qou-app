import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * Shared utility to export a DOM element as a high-quality A4 PDF.
 * This bypassed html2canvas issues with modern CSS (oklch, lab).
 */
export const exportElementAsPdf = async (elementId: string, filenamePrefix: string, recipientName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found.`);
        return;
    }

    try {
        // 1. Capture element as PNG with higher quality (scale: 2)
        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
        });

        // 2. Create jsPDF instance (A4 size: 210mm x 297mm)
        const pdf = new jsPDF('p', 'mm', 'a4');

        // 3. Add the image to the PDF
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // 4. Save the PDF
        const filename = `${filenamePrefix}_${recipientName}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        pdf.save(filename);

        return true;
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        throw error;
    }
};
