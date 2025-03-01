import type { Employee } from '../types';
import config from '../config/config';

export async function sendPlanningEmails(pdfData: Uint8Array, employees: Employee[], dateReference: Date) {
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
    const requestData = {
      pdfBuffer: Array.from(pdfData), // Convertir Uint8Array en tableau normal pour JSON
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email
      })),
      dateReference: dateReference.toISOString()
    };
    
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
