import { supabase } from '../lib/supabase';
import type { Store } from '../types';

export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function updateStore(id: string, updates: Partial<Store>) {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
