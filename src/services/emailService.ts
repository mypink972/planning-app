import type { Employee } from '../types';
import config from '../config/config';

interface EmailOptions {
  subject?: string;
  isMonthly?: boolean;
  month?: string;
  year?: number;
}

export async function sendPlanningEmails(
  pdfData: Uint8Array, 
  employees: Employee[], 
  dateReference: Date,
  options: EmailOptions = {}
) {
  try {
    console.log('Préparation de l\'envoi des emails...');
    console.log('URL API:', config.apiUrl);
    console.log('Nombre d\'employés avec email:', employees.length);
    console.log('Taille du PDF:', pdfData.byteLength, 'octets');
    
    // Vérifier que nous avons des employés avec email
    if (employees.length === 0) {
      throw new Error('Aucun employé avec adresse email');
    }
    
    // Vérifier que le PDF n'est pas vide
    if (pdfData.byteLength === 0) {
      throw new Error('Le PDF généré est vide');
    }
    
    // Préparer les données pour l'envoi
    let emailContent = '';
    
    // Si c'est un planning mensuel, on va créer un contenu personnalisé
    if (options.isMonthly && options.month && options.year) {
      emailContent = `Veuillez trouver ci-joint votre planning pour le mois de ${options.month.toLowerCase()} ${options.year}.`;
      // Créer un objet sans le mot "mensuel"
      options.subject = `Planning - ${options.month} ${options.year}`;
    }
    
    const requestData = {
      pdfBuffer: Array.from(pdfData), // Convertir Uint8Array en tableau normal pour JSON
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email
      })),
      weekStartDate: dateReference.toISOString(), // Pour compatibilité avec le serveur
      isMonthly: options.isMonthly || false,
      subject: options.subject || 'Planning',
      emailContent: emailContent,
      month: options.month,
      year: options.year,
      customEmail: true // Indique au serveur d'utiliser nos valeurs personnalisées
    };
    
    console.log('Données envoyées:', {
      ...requestData,
      pdfBuffer: `[Array de ${requestData.pdfBuffer.length} éléments]`,
      isMonthly: requestData.isMonthly,
      subject: requestData.subject,
      emailContent: requestData.emailContent,
      customEmail: requestData.customEmail
    });
    
    console.log('Envoi de la requête au serveur...');
    
    const response = await fetch(`${config.apiUrl}/send-planning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    console.log('Réponse du serveur reçue, status:', response.status);
    
    // Gérer les erreurs HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur:', errorText);
      throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Emails envoyés avec succès:', result);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    throw error;
  }
}
