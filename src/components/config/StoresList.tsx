import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Store } from '../../types';

export default function StoresList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

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
    } finally {
      setLoading(false);
    }
  }

  async function addStore() {
    if (!newStore.name.trim()) return;

    try {
      const { error } = await supabase
        .from('stores')
        .insert([{
          name: newStore.name.trim(),
          address: newStore.address.trim() || null
        }]);

      if (error) throw error;
      
      setNewStore({ name: '', address: '' });
      loadStores();
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un magasin:', error);
    }
  }

  async function updateStore(id: string, updates: Partial<Store>) {
    try {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setEditingStore(null);
      loadStores();
    } catch (error) {
      console.error('Erreur lors de la mise à jour d\'un magasin:', error);
    }
  }

  async function deleteStore(id: string) {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadStores();
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un magasin:', error);
    }
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Magasins</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Nom du magasin"
            value={newStore.name}
            onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Adresse (optionnelle)"
            value={newStore.address}
            onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={addStore}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Ajouter
          </button>
        </div>

        <ul className="divide-y">
          {stores.map((store) => (
            <li key={store.id} className="py-2 flex justify-between items-center">
              {editingStore?.id === store.id ? (
                <div className="flex gap-4 flex-1 mr-4">
                  <input
                    type="text"
                    value={editingStore.name}
                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={editingStore.address || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
                    className="flex-1 p-2 border rounded"
                    placeholder="Adresse (optionnelle)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStore(editingStore.id, {
                        name: editingStore.name.trim(),
                        address: editingStore.address ? editingStore.address.trim() : null
                      })}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingStore(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-medium">{store.name}</div>
                  {store.address && (
                    <div className="text-sm text-gray-600">{store.address}</div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {editingStore?.id !== store.id && (
                  <button
                    onClick={() => setEditingStore(store)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => deleteStore(store.id)}
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
