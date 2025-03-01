import { supabase } from '../lib/supabase';
export interface AbsenceType {
  id: string;
  label: string;
  created_at?: string;
}

export async function getAbsenceTypes() {
  const { data, error } = await supabase
    .from('absence_types')
    .select('*')
    .order('label');
    
  if (error) throw error;
  return data || [];
}

export async function createAbsenceType(label: string) {
  const { error } = await supabase
    .from('absence_types')
    .insert([{ label }]);

  if (error) throw error;
}

export async function deleteAbsenceType(id: string) {
  const { error } = await supabase
    .from('absence_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
}