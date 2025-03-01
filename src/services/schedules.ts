import { supabase } from '../lib/supabase';
import type { Schedule } from '../types';

export async function getMonthlySchedules(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Premier jour du mois
  const firstDay = new Date(year, month, 1);
  const firstDayStr = firstDay.toISOString().split('T')[0];
  
  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0);
  const lastDayStr = lastDay.toISOString().split('T')[0];
  
  // Récupérer les horaires
  const schedules = await getSchedules(firstDayStr, lastDayStr);
  
  // Récupérer les créneaux horaires pour calculer les heures
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('id, start, end');
  
  // Créer un dictionnaire des créneaux horaires pour un accès rapide
  const timeSlotsMap = (timeSlots || []).reduce((acc, slot) => {
    acc[slot.id] = slot;
    return acc;
  }, {} as Record<string, { id: string, start: string, end: string }>);
  
  // Calculer les heures pour chaque horaire
  return schedules.map(schedule => {
    // Marquer comme absence si pas présent ou si un type d'absence est spécifié
    const isAbsence = !schedule.isPresent || !!schedule.absenceTypeId;
    
    // Calculer les heures si c'est un créneau horaire
    let hours = 0;
    if (!isAbsence && schedule.timeSlotId && timeSlotsMap[schedule.timeSlotId]) {
      const timeSlot = timeSlotsMap[schedule.timeSlotId];
      const startTime = new Date(`2000-01-01T${timeSlot.start}`);
      const endTime = new Date(`2000-01-01T${timeSlot.end}`);
      
      // Calculer la différence en heures
      hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    }
    
    return {
      ...schedule,
      isAbsence,
      hours
    };
  });
}

export async function getSchedules(startDate: string, endDate: string) {
  // Validation des dates
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD format.');
  }

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
    
  if (error) {
    console.error('Erreur lors de la récupération des plannings:', error);
    throw error;
  }
  return data || [];
}

export async function upsertSchedule(schedule: Schedule) {
  // Validation de l'UUID
  if (!isValidUUID(schedule.employeeId)) {
    throw new Error('Invalid employee ID format');
  }

  // Validation de la date
  if (!isValidDate(schedule.date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD format.');
  }

  const { data, error } = await supabase
    .from('schedules')
    .upsert([schedule], {
      onConflict: 'employeeId,date'
    })
    .select();

  if (error) {
    console.error('Erreur lors de l\'insertion du planning:', error);
    throw error;
  }
  return data?.[0];
}

// Copier une semaine de planning
export async function copyWeekSchedules(sourceStartDate: string, targetStartDate: string) {
  console.log('Début de la copie de semaine:', { sourceStartDate, targetStartDate });
  
  try {
    // Calculer les dates de fin
    const sourceEndDate = new Date(sourceStartDate);
    sourceEndDate.setDate(sourceEndDate.getDate() + 6);
    const sourceEndDateStr = sourceEndDate.toISOString().split('T')[0];
    
    const targetEndDate = new Date(targetStartDate);
    targetEndDate.setDate(targetEndDate.getDate() + 6);
    const targetEndDateStr = targetEndDate.toISOString().split('T')[0];

    console.log('Dates calculées:', {
      sourceStartDate,
      sourceEndDateStr,
      targetStartDate,
      targetEndDateStr
    });
    
    // Récupérer les données source
    const [schedulesResponse, storeHoursResponse] = await Promise.all([
      supabase
        .from('schedules')
        .select('*')
        .gte('date', sourceStartDate)
        .lte('date', sourceEndDateStr),
      
      supabase
        .from('store_hours')
        .select('*')
        .gte('date', sourceStartDate)
        .lte('date', sourceEndDateStr)
    ]);

    if (schedulesResponse.error) throw schedulesResponse.error;
    if (storeHoursResponse.error) throw storeHoursResponse.error;

    const sourceSchedules = schedulesResponse.data || [];
    const sourceStoreHours = storeHoursResponse.data || [];

    console.log('Données source:', {
      schedules: sourceSchedules,
      storeHours: sourceStoreHours
    });

    // Créer les nouvelles dates
    const targetSchedules = sourceSchedules.map(schedule => {
      const sourceDate = new Date(schedule.date);
      const daysFromStart = Math.floor((sourceDate.getTime() - new Date(sourceStartDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const targetDate = new Date(targetStartDate);
      targetDate.setDate(targetDate.getDate() + daysFromStart);
      
      // Copier tous les champs sauf l'ID
      const { id, created_at, ...scheduleWithoutId } = schedule;
      return {
        ...scheduleWithoutId,
        date: targetDate.toISOString().split('T')[0]
      };
    });

    const targetStoreHours = sourceStoreHours.map(storeHour => {
      const sourceDate = new Date(storeHour.date);
      const daysFromStart = Math.floor((sourceDate.getTime() - new Date(sourceStartDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const targetDate = new Date(targetStartDate);
      targetDate.setDate(targetDate.getDate() + daysFromStart);
      
      // Copier tous les champs sauf l'ID
      const { id, created_at, ...storeHourWithoutId } = storeHour;
      return {
        ...storeHourWithoutId,
        date: targetDate.toISOString().split('T')[0]
      };
    });

    console.log('Données à copier:', {
      schedules: targetSchedules,
      storeHours: targetStoreHours
    });

    // Supprimer d'abord les données existantes de la semaine cible
    await Promise.all([
      supabase
        .from('schedules')
        .delete()
        .gte('date', targetStartDate)
        .lte('date', targetEndDateStr),
      
      supabase
        .from('store_hours')
        .delete()
        .gte('date', targetStartDate)
        .lte('date', targetEndDateStr)
    ]);

    // Insérer les nouvelles données
    const [newSchedules, newStoreHours] = await Promise.all([
      supabase
        .from('schedules')
        .insert(targetSchedules)
        .select(),
      
      supabase
        .from('store_hours')
        .insert(targetStoreHours)
        .select()
    ]);

    if (newSchedules.error) throw newSchedules.error;
    if (newStoreHours.error) throw newStoreHours.error;

    console.log('Copie terminée avec succès:', {
      schedules: newSchedules.data,
      storeHours: newStoreHours.data
    });

    return {
      schedules: newSchedules.data,
      storeHours: newStoreHours.data
    };
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    throw error;
  }
}

// Supprimer une semaine de planning
export async function deleteWeekSchedules(startDate: string) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split('T')[0];

  // Supprimer à la fois les plannings et les horaires d'ouverture
  const [schedulesResponse, storeHoursResponse] = await Promise.all([
    supabase
      .from('schedules')
      .delete()
      .gte('date', startDate)
      .lte('date', endDateStr),
    
    supabase
      .from('store_hours')
      .delete()
      .gte('date', startDate)
      .lte('date', endDateStr)
  ]);

  if (schedulesResponse.error) {
    console.error('Erreur lors de la suppression des plannings:', schedulesResponse.error);
    throw schedulesResponse.error;
  }
  if (storeHoursResponse.error) {
    console.error('Erreur lors de la suppression des horaires:', storeHoursResponse.error);
    throw storeHoursResponse.error;
  }
}

// Validation helpers
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}