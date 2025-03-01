import { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { AbsenceType } from '../../types';
import { getAbsenceTypes, createAbsenceType, deleteAbsenceType } from '../../services/absenceTypes';

export default function AbsenceTypesList() {
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [newAbsenceType, setNewAbsenceType] = useState('');

  useEffect(() => {
    loadAbsenceTypes();
  }, []);

  async function loadAbsenceTypes() {
    try {
      const data = await getAbsenceTypes();
      setAbsenceTypes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des types d\'absence:', error);
    }
  }

  const handleAddAbsenceType = async () => {
    if (newAbsenceType.trim()) {
      try {
        await createAbsenceType(newAbsenceType.trim());
        setNewAbsenceType('');
        loadAbsenceTypes();
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un type d\'absence:', error);
      }
    }
  };

  const handleDeleteAbsenceType = async (id: string) => {
    try {
      await deleteAbsenceType(id);
      loadAbsenceTypes();
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un type d\'absence:', error);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Types d'absence</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Type d'absence (ex: Congés payés)"
            value={newAbsenceType}
            onChange={(e) => setNewAbsenceType(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleAddAbsenceType}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Ajouter
          </button>
        </div>

        <ul className="divide-y">
          {absenceTypes.map((type) => (
            <li key={type.id} className="py-2 flex justify-between items-center">
              <span>{type.label}</span>
              <button
                onClick={() => handleDeleteAbsenceType(type.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}