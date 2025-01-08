import { supabase } from '../lib/supabase';
import type { TimeSlot } from '../types';
import { formatTime, isValidTimeFormat } from '../utils/time';

export async function getTimeSlots(): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .order('start');
    
  if (error) throw error;
  
  // Tri supplémentaire côté client pour s'assurer que l'ordre est correct
  return (data || []).sort((a, b) => {
    const [aStartHour, aStartMinute] = a.start.split(':').map(Number);
    const [bStartHour, bStartMinute] = b.start.split(':').map(Number);
    const [aEndHour, aEndMinute] = a.end.split(':').map(Number);
    const [bEndHour, bEndMinute] = b.end.split(':').map(Number);
    
    // Comparer d'abord les heures de début
    if (aStartHour !== bStartHour) {
      return aStartHour - bStartHour;
    }
    // Si les heures de début sont égales, comparer les minutes de début
    if (aStartMinute !== bStartMinute) {
      return aStartMinute - bStartMinute;
    }
    
    // Si les heures de début sont identiques, trier par durée (le plus court en premier)
    const aDuration = (aEndHour * 60 + aEndMinute) - (aStartHour * 60 + aStartMinute);
    const bDuration = (bEndHour * 60 + bEndMinute) - (bStartHour * 60 + bStartMinute);
    return aDuration - bDuration;
  });
}

export async function createTimeSlot(start: string, end: string): Promise<void> {
  if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) {
    throw new Error('Invalid time format. Use HH:mm format.');
  }

  const { error } = await supabase
    .from('time_slots')
    .insert([{ 
      start: formatTime(start), 
      end: formatTime(end) 
    }]);

  if (error) throw error;
}

export async function deleteTimeSlot(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}