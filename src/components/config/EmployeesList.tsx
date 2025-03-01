import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getEmployees, updateEmployee } from '../../services/employees';
import type { Employee, Store } from '../../types';

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', storeId: '' });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
    loadStores();
  }, []);

  async function loadEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStores() {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
    }
  }

  async function addEmployee() {
    if (!newEmployee.name.trim()) return;

    try {
      const { error } = await supabase
        .from('employees')
        .insert([{
          name: newEmployee.name.trim(),
          email: newEmployee.email ? newEmployee.email.trim() : undefined,
          store_id: newEmployee.storeId || undefined
        }]);

      if (error) throw error;
      
      setNewEmployee({ name: '', email: '', storeId: '' });
      loadEmployees();
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un employé:', error);
    }
  }

  async function handleUpdateEmployee() {
    if (!editingEmployee || !editingEmployee.name.trim()) return;

    try {
      // Préparer les données de mise à jour
      const updates: Record<string, any> = {
        name: editingEmployee.name.trim(),
        storeId: editingEmployee.storeId || undefined
      };

      // Gérer explicitement le cas où l'email est vide ou nul
      if (editingEmployee.email === '' || editingEmployee.email === null) {
        updates.email = null; // Envoyer null explicitement pour supprimer l'email
      } else if (editingEmployee.email) {
        updates.email = editingEmployee.email.trim();
      }

      await updateEmployee(editingEmployee.id, updates);
      
      setEditingEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error('Erreur lors de la mise à jour d\'un employé:', error);
    }
  }

  async function deleteEmployee(id: string) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadEmployees();
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un employé:', error);
    }
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Employés</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Nom"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email (optionnel)"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <select
            value={newEmployee.storeId}
            onChange={(e) => setNewEmployee({ ...newEmployee, storeId: e.target.value })}
            className="flex-1 p-2 border rounded"
          >
            <option value="">Sélectionner un magasin</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <button
            onClick={addEmployee}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Ajouter
          </button>
        </div>

        <ul className="divide-y">
          {employees.map((employee) => (
            <li key={employee.id} className="py-2 flex justify-between items-center">
              {editingEmployee?.id === employee.id ? (
                <div className="flex gap-4 flex-1 mr-4">
                  <input
                    type="text"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="flex-1 p-2 border rounded"
                    placeholder="Email (optionnel)"
                  />
                  <select
                    value={editingEmployee.storeId || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, storeId: e.target.value })}
                    className="flex-1 p-2 border rounded"
                  >
                    <option value="">Sélectionner un magasin</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateEmployee}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingEmployee(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-600">
                    {employee.email && <div>{employee.email}</div>}
                    {employee.store && <div>Magasin : {employee.store.name}</div>}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {editingEmployee?.id !== employee.id && (
                  <button
                    onClick={() => setEditingEmployee(employee)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => deleteEmployee(employee.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}