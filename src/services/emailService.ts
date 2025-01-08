import type { Employee } from '../types';
import config from '../config/config';

export async function sendPlanningEmails(pdfData: Uint8Array, employees: Employee[], weekStartDate: Date) {
  try {
    const response = await fetch(`${config.apiUrl}/send-planning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBuffer: Array.from(pdfData), // Convertir Uint8Array en tableau normal pour JSON
        employees,
        weekStartDate: weekStartDate.toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi des emails');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    throw error;
  }
}
