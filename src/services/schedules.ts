import { supabase } from '../lib/supabase';
import type { Schedule } from '../types';

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
    
  if (error) throw error;
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

  if (error) throw error;
  return data?.[0];
}

// Copier une semaine de planning
export async function copyWeekSchedules(sourceStartDate: string, targetStartDate: string) {
  // Récupérer les plannings de la semaine source
  const sourceEndDate = new Date(sourceStartDate);
  sourceEndDate.setDate(sourceEndDate.getDate() + 6);
  const sourceEndDateStr = sourceEndDate.toISOString().split('T')[0];
  
  const targetEndDate = new Date(targetStartDate);
  targetEndDate.setDate(targetEndDate.getDate() + 6);
  const targetEndDateStr = targetEndDate.toISOString().split('T')[0];
  
  // Récupérer à la fois les plannings et les horaires d'ouverture
  const [schedulesResponse, storeHoursResponse] = await Promise.all([
    supabase
      .from('schedules')
      .select('*')
      .gte('date', sourceStartDate)
      .lte('date', sourceEndDateStr),
    
    supabase
      .from('store_hours')
      .select('id,date,is_closed,time_slot_id')
      .gte('date', sourceStartDate)
      .lte('date', sourceEndDateStr)
  ]);

  if (schedulesResponse.error) throw schedulesResponse.error;
  if (storeHoursResponse.error) throw storeHoursResponse.error;

  const sourceSchedules = schedulesResponse.data || [];
  const sourceStoreHours = storeHoursResponse.data || [];

  // Préparer les nouveaux plannings
  const targetSchedules = sourceSchedules.map(schedule => {
    const sourceDate = new Date(schedule.date);
    const sourceStartDateObj = new Date(sourceStartDate);
    const daysDiff = Math.floor((sourceDate.getTime() - sourceStartDateObj.getTime()) / (1000 * 60 * 60 * 24));

    const targetDate = new Date(targetStartDate);
    targetDate.setDate(targetDate.getDate() + daysDiff);

    return {
      employeeId: schedule.employeeId,
      date: targetDate.toISOString().split('T')[0],
      isPresent: schedule.isPresent,
      timeSlotId: schedule.timeSlotId,
      absenceTypeId: schedule.absenceTypeId
    };
  });

  // Préparer les nouveaux horaires d'ouverture
  const targetStoreHours = sourceStoreHours.map(storeHour => {
    const sourceDate = new Date(storeHour.date);
    const sourceStartDateObj = new Date(sourceStartDate);
    const daysDiff = Math.floor((sourceDate.getTime() - sourceStartDateObj.getTime()) / (1000 * 60 * 60 * 24));

    const targetDate = new Date(targetStartDate);
    targetDate.setDate(targetDate.getDate() + daysDiff);

    return {
      date: targetDate.toISOString().split('T')[0],
      is_closed: storeHour.is_closed,
      time_slot_id: storeHour.time_slot_id
    };
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

  // Insérer les nouveaux plannings et horaires d'ouverture
  const [scheduleInsertResponse, storeHoursInsertResponse] = await Promise.all([
    supabase
      .from('schedules')
      .insert(targetSchedules)
      .select(),
    
    supabase
      .from('store_hours')
      .insert(targetStoreHours)
      .select()
  ]);

  if (scheduleInsertResponse.error) {
    console.error('Erreur lors de l\'insertion des plannings:', scheduleInsertResponse.error);
    throw scheduleInsertResponse.error;
  }
  if (storeHoursInsertResponse.error) {
    console.error('Erreur lors de l\'insertion des horaires:', storeHoursInsertResponse.error);
    throw storeHoursInsertResponse.error;
  }

  return {
    schedules: scheduleInsertResponse.data,
    storeHours: storeHoursInsertResponse.data
  };
}

// Supprimer une semaine de planning
export async function deleteWeekSchedules(startDate: string) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const { error } = await supabase
    .from('schedules')
    .delete()
    .gte('date', startDate)
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) throw error;
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