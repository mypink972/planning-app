import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateToFrench } from './dates';

export async function exportTableToPDF(tableElement: HTMLTableElement | null, currentDate: Date) {
  try {
    console.log('Début de l\'export PDF');
    
    if (!tableElement) {
      throw new Error('La référence de la table est invalide');
    }

    console.log('Table HTML:', tableElement.outerHTML);

    const canvas = await html2canvas(tableElement, {
      scale: 2,
      useCORS: true,
      logging: true,
      onclone: (document) => {
        console.log('Clonage du document');
        const table = document.querySelector('table');
        if (table) {
          console.log('Table trouvée dans le clone');
          const cells = table.querySelectorAll('tr > *:last-child');
          console.log('Nombre de cellules à masquer:', cells.length);
          cells.forEach((cell) => {
            (cell as HTMLElement).style.display = 'none';
          });
        } else {
          console.error('Table non trouvée dans le document cloné');
        }
      }
    });

    console.log('Canvas créé avec succès');
    const imgData = canvas.toDataURL('image/png');
    console.log('Image data créé');

    // Créer un nouveau document PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Obtenir les dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    console.log('Dimensions PDF:', { pdfWidth, pdfHeight });

    // Calculer les dimensions pour que l'image occupe toute la largeur
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    console.log('Dimensions image:', { imgWidth, imgHeight, ratio });

    let finalWidth = pdfWidth - 20; // -20 pour les marges
    let finalHeight = finalWidth / ratio;

    // Si la hauteur est trop grande, ajuster en fonction de la hauteur
    if (finalHeight > pdfHeight - 15) { // -15 pour les marges
      finalHeight = pdfHeight - 15;
      finalWidth = finalHeight * ratio;
    }
    console.log('Dimensions finales:', { finalWidth, finalHeight });

    const title = `Planning - ${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}`;
    console.log('Titre:', title);
    
    pdf.setFontSize(16);
    pdf.text(title, 14, 15);
    
    // Ajuster les marges pour centrer le contenu étiré
    console.log('Ajout de l\'image au PDF');
    pdf.addImage(imgData, 'PNG', 10, 20, finalWidth, finalHeight);
    
    // Convertir le PDF en tableau d'octets
    console.log('Conversion en tableau d\'octets');
    const pdfData = pdf.output('arraybuffer');
    
    console.log('Export PDF terminé avec succès');
    return new Uint8Array(pdfData);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
}