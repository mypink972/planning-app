import { supabase } from '../lib/supabase';
import type { Employee } from '../types';

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}