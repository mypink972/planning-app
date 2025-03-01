import { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { TimeSlot } from '../../types';
import { getTimeSlots, createTimeSlot, deleteTimeSlot } from '../../services/timeSlots';
import { formatTimeForDisplay } from '../../utils/time';

export default function TimeSlotsList() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({
    startHour: '09',
    startMinute: '00',
    endHour: '17',
    endMinute: '00'
  });

  useEffect(() => {
    loadTimeSlots();
  }, []);

  async function loadTimeSlots() {
    try {
      const data = await getTimeSlots();
      setTimeSlots(data);
    } catch (error) {
      console.error('Erreur lors du chargement des horaires:', error);
    }
  }

  const handleAddTimeSlot = async () => {
    const start = `${newTimeSlot.startHour}:${newTimeSlot.startMinute}`;
    const end = `${newTimeSlot.endHour}:${newTimeSlot.endMinute}`;
    
    try {
      await createTimeSlot(start, end);
      loadTimeSlots();
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un horaire:', error);
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    try {
      await deleteTimeSlot(id);
      loadTimeSlots();
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un horaire:', error);
    }
  };

  const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const MINUTES_OPTIONS = ['00', '15', '30', '45'];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Horaires prédéfinis</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 mb-4 items-center">
          <div className="flex items-center gap-2">
            <select
              value={newTimeSlot.startHour}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startHour: e.target.value })}
              className="p-2 border rounded"
            >
              {HOURS.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <span>:</span>
            <select
              value={newTimeSlot.startMinute}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startMinute: e.target.value })}
              className="p-2 border rounded"
            >
              {MINUTES_OPTIONS.map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
          </div>

          <span>à</span>

          <div className="flex items-center gap-2">
            <select
              value={newTimeSlot.endHour}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endHour: e.target.value })}
              className="p-2 border rounded"
            >
              {HOURS.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <span>:</span>
            <select
              value={newTimeSlot.endMinute}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endMinute: e.target.value })}
              className="p-2 border rounded"
            >
              {MINUTES_OPTIONS.map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddTimeSlot}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Ajouter
          </button>
        </div>

        <ul className="divide-y">
          {timeSlots.map((slot) => (
            <li key={slot.id} className="py-2 flex justify-between items-center">
              <span>{formatTimeForDisplay(slot.start)} - {formatTimeForDisplay(slot.end)}</span>
              <button
                onClick={() => handleDeleteTimeSlot(slot.id)}
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