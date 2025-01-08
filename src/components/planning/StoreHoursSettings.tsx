import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { getDefaultStoreHours } from '../../utils/defaultStoreHours';
import { formatDateToFrench } from '../../utils/dates';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface StoreHoursSettingsProps {
  date: Date;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function StoreHoursSettings({ date, value, onChange, onClose }: StoreHoursSettingsProps) {
  const [isClosed, setIsClosed] = React.useState(value === 'closed');
  
  const defaultTimeValues = {
    startHour: '09',
    startMinute: '00',
    endHour: '17',
    endMinute: '00'
  };

  const parseTimeValue = (val: string) => {
    if (val === 'closed') return defaultTimeValues;
    const [sh = defaultTimeValues.startHour, sm = defaultTimeValues.startMinute, 
           eh = defaultTimeValues.endHour, em = defaultTimeValues.endMinute] = val?.split(':') || [];
    return { startHour: sh, startMinute: sm, endHour: eh, endMinute: em };
  };

  const [timeValues, setTimeValues] = React.useState(() => {
    const defaultValue = getDefaultStoreHours(date);
    return parseTimeValue(value || defaultValue);
  });

  useEffect(() => {
    const defaultValue = getDefaultStoreHours(date);
    setTimeValues(parseTimeValue(value || defaultValue));
    setIsClosed(value === 'closed' || defaultValue === 'closed');
  }, [value, date]);

  const handleSave = () => {
    if (isClosed) {
      onChange('closed');
    } else {
      const { startHour, startMinute, endHour, endMinute } = timeValues;
      onChange(`${startHour}:${startMinute}:${endHour}:${endMinute}`);
    }
  };

  const handleChange = (type: keyof typeof timeValues, newValue: string) => {
    setTimeValues(prev => ({
      ...prev,
      [type]: newValue
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Horaires du {formatDateToFrench(date, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) => setIsClosed(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Fermé</span>
          </label>
        </div>

        {!isClosed && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="w-24">Ouverture :</label>
              <div className="flex items-center gap-1">
                <select 
                  value={timeValues.startHour}
                  onChange={(e) => handleChange('startHour', e.target.value)}
                  className="p-2 border rounded w-20"
                >
                  {HOURS.map(hour => (
                    <option key={`start-${hour}`} value={hour}>{hour}</option>
                  ))}
                </select>
                <span>:</span>
                <select 
                  value={timeValues.startMinute}
                  onChange={(e) => handleChange('startMinute', e.target.value)}
                  className="p-2 border rounded w-20"
                >
                  {MINUTES.map(minute => (
                    <option key={`start-${minute}`} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-24">Fermeture :</label>
              <div className="flex items-center gap-1">
                <select 
                  value={timeValues.endHour}
                  onChange={(e) => handleChange('endHour', e.target.value)}
                  className="p-2 border rounded w-20"
                >
                  {HOURS.map(hour => (
                    <option key={`end-${hour}`} value={hour}>{hour}</option>
                  ))}
                </select>
                <span>:</span>
                <select 
                  value={timeValues.endMinute}
                  onChange={(e) => handleChange('endMinute', e.target.value)}
                  className="p-2 border rounded w-20"
                >
                  {MINUTES.map(minute => (
                    <option key={`end-${minute}`} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              handleSave();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}