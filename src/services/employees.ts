import { supabase } from '../lib/supabase';
import type { Employee, EmployeeRaw } from '../types';

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*, store:stores(id, name)')
    .order('name');
    
  if (error) throw error;
  
  // Convertir les données brutes en format Employee
  return (data || []).map((emp: EmployeeRaw) => ({
    ...emp,
    storeId: emp.store_id
  })) as Employee[];
}

export async function getEmployeesByStore(storeId?: string) {
  let query = supabase
    .from('employees')
    .select('*, store:stores(id, name)')
    .order('name');
    
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Convertir les données brutes en format Employee
  return (data || []).map((emp: EmployeeRaw) => ({
    ...emp,
    storeId: emp.store_id
  })) as Employee[];
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  // Convertir storeId en store_id pour la base de données
  const dbUpdates: any = { ...updates };
  
  if ('storeId' in updates) {
    dbUpdates.store_id = updates.storeId;
    delete dbUpdates.storeId;
  }

  // S'assurer que les valeurs null sont correctement passées à la base de données
  // Supabase a besoin que les valeurs null soient explicitement définies
  // pour supprimer une valeur existante
  console.log('Mise à jour de l\'employé avec les données:', dbUpdates);
  
  const { data, error } = await supabase
    .from('employees')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Erreur lors de la mise à jour de l\'employé:', error);
    throw error;
  }
  
  console.log('Employé mis à jour avec succès:', data);
  return data;
}