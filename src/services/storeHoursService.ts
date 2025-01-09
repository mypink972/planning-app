import { supabase } from '../lib/supabase';
import type { StoreHours, StoreHoursInput } from '../types/storeHours';

const TABLE_NAME = 'store_hours';

export async function getStoreHoursByWeek(startDate: Date, endDate: Date): Promise<StoreHours[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching store hours:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    date: item.date,
    isClosed: item.is_closed,
    timeSlotId: item.time_slot_id
  }));
}

export async function upsertStoreHours(storeHours: StoreHoursInput): Promise<StoreHours | null> {
  const dbData = {
    date: storeHours.date,
    is_closed: storeHours.isClosed,
    time_slot_id: storeHours.isClosed ? null : storeHours.timeSlotId
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert([dbData], {
      onConflict: 'date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting store hours:', error);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    isClosed: data.is_closed,
    timeSlotId: data.time_slot_id
  };
}

export async function deleteStoreHours(date: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('date', date);

  if (error) {
    console.error('Error deleting store hours:', error);
  }
}
