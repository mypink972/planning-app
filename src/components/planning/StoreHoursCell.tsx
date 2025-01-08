import { useState } from 'react';
import StoreHoursSettings from './StoreHoursSettings';
import { getDefaultStoreHours } from '../../utils/defaultStoreHours';

interface StoreHoursCellProps {
  date: Date;
  value: string;
  onChange: (value: string) => void;
}

export default function StoreHoursCell({ date, value, onChange }: StoreHoursCellProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const formatTime = (timeStr: string) => {
    if (!timeStr) return formatTime(getDefaultStoreHours(date));
    if (timeStr === 'closed') return 'Fermé';
    
    const [startHour, startMinute, endHour, endMinute] = timeStr.split(':');
    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="text-sm hover:text-blue-600 transition-colors"
      >
        {formatTime(value)}
      </button>
      {isSettingsOpen && (
        <StoreHoursSettings
          date={date}
          value={value || getDefaultStoreHours(date)}
          onChange={(newValue) => {
            onChange(newValue);
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}