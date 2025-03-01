import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateToFrench, getWeekDates, getWeekNumber } from './dates';
import type { Employee } from '../types';
import type { Schedule } from '../types';
import { supabase } from '../lib/supabase';

export async function exportMonthlyPDF(schedules: Schedule[], employees: Employee[], currentDate: Date, autoDownload: boolean = true) {
  try {
    console.log('Début de l\'export PDF mensuel');
    
    // Créer un nouveau document PDF en format paysage
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Obtenir les dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Titre
    const title = `Planning Mensuel - ${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}`;
    pdf.setFontSize(16);
    pdf.text(title, 14, 15);
    
    // Paramètres de la table
    const startY = 25;
    const cellPadding = 3;
    const headerHeight = 10;
    const rowHeight = 15; // Augmenter la hauteur des lignes
    
    // Obtenir les jours du mois
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Largeurs des colonnes
    const nameColWidth = 30; // Réduire la largeur de la colonne des noms
    const dayColWidth = (pdfWidth - nameColWidth - 20) / daysInMonth; // -20 pour les marges
    
    // En-tête
    pdf.setFillColor(220, 220, 220);
    pdf.rect(10, startY, pdfWidth - 20, headerHeight, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Employé', 10 + cellPadding, startY + headerHeight/2 + 2, { align: 'left' });
    
    // En-têtes des jours
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = dayDate.getDay(); // 0 = dimanche, 1 = lundi, ...
      
      // Colorer les weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Samedi ou dimanche
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10 + nameColWidth + (day - 1) * dayColWidth, startY, dayColWidth, headerHeight, 'F');
      }
      
      // Jour du mois et jour de la semaine
      const dayLabel = `${day}\n${['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek]}`;
      const xPos = 10 + nameColWidth + (day - 1) * dayColWidth + dayColWidth/2;
      pdf.text(`${day}`, xPos, startY + headerHeight/2 - 1, { align: 'center' });
      pdf.text(`${['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek]}`, xPos, startY + headerHeight/2 + 4, { align: 'center' });
    }
    
    // Contenu
    let currentY = startY + headerHeight;
    
    // Organiser les horaires par employé et par jour
    const employeeSchedules: { [employeeId: string]: { [day: number]: { timeSlot: string } } } = {};
    
    // Récupérer les créneaux horaires
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('id, start, end');
      
    const timeSlotsMap: Record<string, { start: string, end: string }> = {};
    if (timeSlots) {
      timeSlots.forEach(slot => {
        timeSlotsMap[slot.id] = {
          start: slot.start.substring(0, 5), // Format HH:MM
          end: slot.end.substring(0, 5)     // Format HH:MM
        };
      });
    }
    
    // Organiser les horaires
    schedules.forEach(schedule => {
      if (!schedule.isAbsence && schedule.isPresent) {
        // Convertir la date de string à Date et s'assurer qu'on a la bonne date locale
        // Le format de schedule.date est YYYY-MM-DD
        const dateParts = schedule.date.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Les mois commencent à 0 en JavaScript
        const day = parseInt(dateParts[2]);
        
        // Créer une date locale pour éviter les problèmes de fuseau horaire
        const scheduleDate = new Date(year, month, day);
        
        if (!employeeSchedules[schedule.employeeId]) {
          employeeSchedules[schedule.employeeId] = {};
        }
        
        let timeSlotText = '';
        if (schedule.timeSlotId && timeSlotsMap[schedule.timeSlotId]) {
          const { start, end } = timeSlotsMap[schedule.timeSlotId];
          timeSlotText = `${start}-${end}`;
        }
        
        // Utiliser le jour du mois comme clé
        const dayOfMonth = scheduleDate.getDate();
        employeeSchedules[schedule.employeeId][dayOfMonth] = {
          timeSlot: timeSlotText
        };
      }
    });
    
    // Dessiner les lignes pour chaque employé
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6); // Taille de police encore plus petite pour les horaires
    
    employees.forEach((employee, index) => {
      // Alterner les couleurs de fond
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(10, currentY, pdfWidth - 20, rowHeight, 'F');
      }
      
      // Nom de l'employé
      pdf.setFontSize(9);
      pdf.text(employee.name, 10 + cellPadding, currentY + rowHeight/2, { align: 'left' });
      
      // Horaires par jour
      pdf.setFontSize(6);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dayDate.getDay();
        
        // Colorer les weekends dans le corps du tableau
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (index % 2 !== 0) { // Seulement si la ligne n'est pas déjà colorée
            pdf.setFillColor(240, 240, 240);
            pdf.rect(10 + nameColWidth + (day - 1) * dayColWidth, currentY, dayColWidth, rowHeight, 'F');
          }
        }
        
        const scheduleInfo = employeeSchedules[employee.id]?.[day];
        if (scheduleInfo) {
          const xPos = 10 + nameColWidth + (day - 1) * dayColWidth + dayColWidth/2;
          
          // Toujours diviser l'horaire en deux lignes (début en haut, fin en bas)
          const timeSlot = scheduleInfo.timeSlot;
          const parts = timeSlot.split('-');
          
          if (parts.length === 2) {
            // Heure de début en haut
            pdf.text(parts[0], xPos, currentY + rowHeight/2 - 3, { align: 'center' });
            // Heure de fin en bas
            pdf.text(parts[1], xPos, currentY + rowHeight/2 + 3, { align: 'center' });
          } else {
            // Si format inattendu, afficher tel quel
            pdf.text(timeSlot, xPos, currentY + rowHeight/2, { align: 'center' });
          }
        }
      }
      
      currentY += rowHeight;
    });
    
    // Télécharger le PDF seulement si autoDownload est true
    if (autoDownload) {
      const fileName = `planning_mensuel_${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' }).toLowerCase().replace(/ /g, '_')}.pdf`;
      pdf.save(fileName);
    }
    
    console.log('Export PDF mensuel terminé avec succès');
    return pdf.output('arraybuffer');
  } catch (error) {
    console.error('Erreur lors de l\'export PDF mensuel:', error);
    throw error;
  }
}

export async function exportTableToPDF(tableElement: HTMLTableElement | null, currentDate: Date, autoDownload: boolean = true, exportType: 'weekly' | 'monthly' = 'weekly') {
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

    let title = '';
    let fileName = '';
    
    if (exportType === 'weekly') {
      title = `Planning Semaine ${getWeekNumber(currentDate)} - ${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}`;
      fileName = `planning_semaine_${getWeekNumber(currentDate)}_${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' }).toLowerCase().replace(/ /g, '_')}.pdf`;
    } else {
      title = `Planning Mensuel - ${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}`;
      fileName = `planning_mensuel_${formatDateToFrench(currentDate, { month: 'long', year: 'numeric' }).toLowerCase().replace(/ /g, '_')}.pdf`;
    }
    
    console.log('Titre:', title);
    
    pdf.setFontSize(16);
    pdf.text(title, 14, 15);
    
    // Ajuster les marges pour centrer le contenu étiré
    console.log('Ajout de l\'image au PDF');
    pdf.addImage(imgData, 'PNG', 10, 20, finalWidth, finalHeight);
    
    // Télécharger le PDF seulement si autoDownload est true
    if (autoDownload) {
      console.log('Téléchargement du PDF');
      pdf.save(fileName);
    }
    
    // Convertir le PDF en tableau d'octets pour l'envoi par email si nécessaire
    console.log('Conversion en tableau d\'octets');
    const pdfData = pdf.output('arraybuffer');
    
    console.log('Export PDF terminé avec succès');
    return new Uint8Array(pdfData);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
}