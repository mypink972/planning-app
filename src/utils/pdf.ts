import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateToFrench, getWeekNumber } from './dates';

export async function exportTableToPDF(tableRef: HTMLTableElement, currentDate: Date) {
  const canvas = await html2canvas(tableRef, {
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (document) => {
      const table = document.querySelector('table');
      if (table) {
        // Masquer la colonne Total
        const cells = table.querySelectorAll('tr > *:last-child');
        cells.forEach((cell) => {
          (cell as HTMLElement).style.display = 'none';
        });
      }
    }
  });

  const imgData = canvas.toDataURL('image/png');

  // Créer un nouveau document PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Obtenir les dimensions
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Calculer les dimensions pour que l'image occupe toute la largeur
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / imgHeight;

  let finalWidth = pdfWidth - 20; // -20 pour les marges
  let finalHeight = finalWidth / ratio;

  // Si la hauteur est trop grande, ajuster en fonction de la hauteur
  if (finalHeight > pdfHeight - 15) { // -15 pour les marges
    finalHeight = pdfHeight - 15;
    finalWidth = finalHeight * ratio;
  }

  const title = `Planning - ${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}`;
  
  pdf.setFontSize(16);
  pdf.text(title, 14, 15);
  
  // Ajuster les marges pour centrer le contenu étiré
  pdf.addImage(imgData, 'PNG', 10, 20, finalWidth, finalHeight);
  
  // Convertir le PDF en tableau d'octets
  const pdfData = pdf.output('arraybuffer');
  
  return new Uint8Array(pdfData);
}