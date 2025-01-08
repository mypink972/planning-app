import React from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface StoreHoursProps {
  date: Date;
  value?: string;
  onChange: (value: string) => void;
}

export default function StoreHours({ date, value, onChange }: StoreHoursProps) {
  // Valeurs par défaut
  const defaultValues = {
    startHour: '06',
    startMinute: '00',
    endHour: '20',
    endMinute: '00'
  };

  // Parser la valeur existante ou utiliser les valeurs par défaut
  const { startHour, startMinute, endHour, endMinute } = value?.split(':').reduce((acc, val, index) => {
    switch(index) {
      case 0: return { ...acc, startHour: val || defaultValues.startHour };
      case 1: return { ...acc, startMinute: val || defaultValues.startMinute };
      case 2: return { ...acc, endHour: val || defaultValues.endHour };
      case 3: return { ...acc, endMinute: val || defaultValues.endMinute };
      default: return acc;
    }
  }, defaultValues);

  const handleChange = (type: 'startHour' | 'startMinute' | 'endHour' | 'endMinute', newValue: string) => {
    const values = {
      startHour,
      startMinute,
      endHour,
      endMinute,
      [type]: newValue
    };
    
    onChange(`${values.startHour}:${values.startMinute}:${values.endHour}:${values.endMinute}`);
  };

  return (
    <div className="flex items-center gap-1 justify-center">
      <select 
        value={startHour}
        onChange={(e) => handleChange('startHour', e.target.value)}
        className="p-1 border rounded w-16"
      >
        {HOURS.map(hour => (
          <option key={`start-${hour}`} value={hour}>{hour}</option>
        ))}
      </select>
      <span>:</span>
      <select 
        value={startMinute}
        onChange={(e) => handleChange('startMinute', e.target.value)}
        className="p-1 border rounded w-14"
      >
        {MINUTES.map(minute => (
          <option key={`start-${minute}`} value={minute}>{minute}</option>
        ))}
      </select>
      
      <span className="mx-1">-</span>
      
      <select 
        value={endHour}
        onChange={(e) => handleChange('endHour', e.target.value)}
        className="p-1 border rounded w-16"
      >
        {HOURS.map(hour => (
          <option key={`end-${hour}`} value={hour}>{hour}</option>
        ))}
      </select>
      <span>:</span>
      <select 
        value={endMinute}
        onChange={(e) => handleChange('endMinute', e.target.value)}
        className="p-1 border rounded w-14"
      >
        {MINUTES.map(minute => (
          <option key={`end-${minute}`} value={minute}>{minute}</option>
        ))}
      </select>
    </div>
  );
}