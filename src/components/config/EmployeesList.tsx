import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateEmployee } from '../../services/employees';
import type { Employee } from '../../types';

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '' });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addEmployee() {
    if (!newEmployee.name.trim()) return;

    try {
      const { error } = await supabase
        .from('employees')
        .insert([{
          name: newEmployee.name.trim(),
          email: newEmployee.email.trim() || null
        }]);

      if (error) throw error;
      
      setNewEmployee({ name: '', email: '' });
      loadEmployees();
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un employé:', error);
    }
  }

  async function handleUpdateEmployee() {
    if (!editingEmployee || !editingEmployee.name.trim()) return;

    try {
      await updateEmployee(editingEmployee.id, {
        name: editingEmployee.name.trim(),
        email: editingEmployee.email?.trim() || null
      });
      
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
                  {employee.email && (
                    <div className="text-sm text-gray-600">{employee.email}</div>
                  )}
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