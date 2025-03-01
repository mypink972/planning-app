import React from 'react';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Trash2, X } from 'lucide-react';
import type { Employee, Schedule, TimeSlot, AbsenceType } from '../../types';
import ScheduleModal from './ScheduleModal';
import { calculateTotalHours, formatDateToFrench } from '../../utils/dates';
import { formatTimeForDisplay } from '../../utils/time';
import { getEmployeesByStore } from '../../services/employees';
import { getTimeSlots } from '../../services/timeSlots';
import { getAbsenceTypes } from '../../services/absenceTypes';
import { getSchedules, upsertSchedule, copyWeekSchedules, deleteWeekSchedules } from '../../services/schedules';
import { getDefaultStoreHours } from '../../utils/defaultStoreHours';
import { upsertStoreHours } from '../../services/storeHoursService';

interface WeeklyScheduleProps {
  weekDates: Date[];
  storeHours: {
    date: string;
    isClosed: boolean;
    timeSlotId?: string;
  }[];
  onScheduleChange?: () => void;
  tableRef?: React.RefObject<HTMLTableElement>;
  onStoreHoursChange: (date: Date, value: string) => Promise<void>;
  selectedStoreId?: string;
}

export interface WeeklyScheduleHandle {
  handleCopyWeek: () => void;
  handleDeleteWeek: () => void;
}

interface StoreHoursCellProps {
  date: Date;
  defaultHours: { start: string; end: string } | 'closed';
  storeHours: {
    date: string;
    isClosed: boolean;
    timeSlotId?: string;
  }[];
  onStoreHoursChange: (newStoreHours: {
    date: string;
    isClosed: boolean;
    timeSlotId?: string;
  }[]) => void;
}

const StoreHoursSettings = ({ date, value, onChange, onClose }: {
  date: Date;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) => {
  const [isClosed, setIsClosed] = React.useState(value === 'closed');
  const defaultTimeValues = {
    startHour: '09',
    startMinute: '00',
    endHour: '20',
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
    return parseTimeValue(typeof defaultValue === 'string' ? defaultValue : `${defaultValue.start.replace(':', ':')}:${defaultValue.end.replace(':', ':')}`);
  });

  const handleSave = () => {
    if (isClosed) {
      onChange('closed');
    } else {
      const { startHour, startMinute, endHour, endMinute } = timeValues;
      onChange(`${startHour}:${startMinute}:${endHour}:${endMinute}`);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Horaires du {formatDateToFrench(date, { weekday: 'long', day: 'numeric' })}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) => setIsClosed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Fermé</span>
          </label>

          {!isClosed && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure d'ouverture</label>
                <div className="mt-1 flex space-x-2">
                  <select
                    value={timeValues.startHour}
                    onChange={(e) => setTimeValues(v => ({ ...v, startHour: e.target.value }))}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <span className="text-xl">:</span>
                  <select
                    value={timeValues.startMinute}
                    onChange={(e) => setTimeValues(v => ({ ...v, startMinute: e.target.value }))}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {['00', '15', '30', '45'].map((minute) => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de fermeture</label>
                <div className="mt-1 flex space-x-2">
                  <select
                    value={timeValues.endHour}
                    onChange={(e) => setTimeValues(v => ({ ...v, endHour: e.target.value }))}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <span className="text-xl">:</span>
                  <select
                    value={timeValues.endMinute}
                    onChange={(e) => setTimeValues(v => ({ ...v, endMinute: e.target.value }))}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {['00', '15', '30', '45'].map((minute) => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const StoreHoursCell = ({ date, defaultHours, storeHours, onStoreHoursChange }: StoreHoursCellProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const dateStr = date.toISOString().split('T')[0];
  const storeHour = storeHours.find(sh => sh.date === dateStr);
  
  const formatTime = (timeSlotId: string | undefined) => {
    if (!timeSlotId) return null;
    const [start, end] = timeSlotId.split('-');
    return `${start} - ${end}`;
  };

  const displayHours = () => {
    if (storeHour?.isClosed) {
      return 'Fermé';
    }
    
    if (storeHour?.timeSlotId) {
      return formatTime(storeHour.timeSlotId);
    }

    if (defaultHours === 'closed') {
      return 'Fermé';
    }

    return `${defaultHours.start} - ${defaultHours.end}`;
  };

  const handleChange = async (value: string) => {
    const newStoreHours = [...storeHours];
    const index = newStoreHours.findIndex(sh => sh.date === dateStr);
    
    let updatedStoreHour;
    if (value === 'closed') {
      updatedStoreHour = { 
        date: dateStr, 
        isClosed: true 
      };
    } else {
      const [startHour, startMinute, endHour, endMinute] = value.split(':');
      const timeSlotId = `${startHour}:${startMinute}-${endHour}:${endMinute}`;
      updatedStoreHour = { 
        date: dateStr, 
        isClosed: false,
        timeSlotId
      };
    }

    // Mettre à jour la base de données
    const result = await upsertStoreHours(updatedStoreHour);
    if (result) {
      // Mettre à jour l'état local
      if (index !== -1) {
        newStoreHours[index] = result;
      } else {
        newStoreHours.push(result);
      }
      onStoreHoursChange(newStoreHours);
    }
  };
  
  return (
    <div className="text-sm text-gray-500">
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="hover:text-blue-600 transition-colors cursor-pointer"
      >
        {displayHours()}
      </button>

      {isSettingsOpen && (
        <StoreHoursSettings
          date={date}
          value={storeHour?.isClosed ? 'closed' : storeHour?.timeSlotId ? storeHour.timeSlotId.replace('-', ':') : defaultHours === 'closed' ? '09:00:20:00' : `${defaultHours.start.replace(':', ':')}:${defaultHours.end.replace(':', ':')}`}
          onChange={handleChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default forwardRef<WeeklyScheduleHandle, WeeklyScheduleProps>(function WeeklySchedule({
  weekDates,
  storeHours: initialStoreHours,
  onScheduleChange,
  tableRef,
  onStoreHoursChange,
  selectedStoreId
}, ref) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [absenceTypes, setAbsenceTypes] = React.useState<AbsenceType[]>([]);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [storeHours, setStoreHours] = React.useState(initialStoreHours);
  const [selectedCell, setSelectedCell] = React.useState<{
    employeeId: string;
    date: Date;
  } | null>(null);
  const [showCopyModal, setShowCopyModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSourceDate, setSelectedSourceDate] = React.useState<Date | null>(null);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [employeesData, timeSlotsData, absenceTypesData] = await Promise.all([
        getEmployeesByStore(selectedStoreId),
        getTimeSlots(),
        getAbsenceTypes()
      ]);

      setEmployees(employeesData);
      setTimeSlots(timeSlotsData);
      setAbsenceTypes(absenceTypesData);
      await loadSchedules();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadInitialData();
  }, [selectedStoreId]);

  React.useEffect(() => {
    setStoreHours(initialStoreHours);
  }, [initialStoreHours]);

  React.useEffect(() => {
    if (weekDates.length > 0) {
      loadSchedules();
    }
  }, [weekDates]);

  async function loadSchedules() {
    try {
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      const data = await getSchedules(startDate, endDate);
      setSchedules(data);
    } catch (error) {
      console.error('Erreur lors du chargement des plannings:', error);
    }
  }

  const isStoreClosed = (date: Date) => {
    const storeHour = storeHours.find(
      (sh) => sh.date === date.toISOString().split('T')[0]
    );
    if (storeHour) return storeHour.isClosed;

    const defaultHours = getDefaultStoreHours(date);
    return defaultHours === 'closed';
  };

  const getScheduleForCell = (employeeId: string, date: Date) => {
    if (!schedules) return { employeeId, date: date.toISOString().split('T')[0], isPresent: true };
    
    const dateStr = date.toISOString().split('T')[0];
    return (
      schedules.find(
        (s) => s.employeeId === employeeId && s.date === dateStr
      ) || {
        employeeId,
        date: dateStr,
        isPresent: true
      }
    );
  };

  const calculateWeeklyTotal = (employeeId: string) => {
    return weekDates.reduce((total, date) => {
      if (isStoreClosed(date)) return total;
      
      const schedule = getScheduleForCell(employeeId, date);
      if (schedule.isPresent && schedule.timeSlotId) {
        const timeSlot = timeSlots.find((ts) => ts.id === schedule.timeSlotId);
        return total + calculateTotalHours(timeSlot);
      }
      return total;
    }, 0);
  };

  const handleScheduleChange = async (schedule: Schedule, closeModal: boolean = true) => {
    try {
      await upsertSchedule(schedule);
      
      // Mettre à jour le state local immédiatement
      setSchedules(prevSchedules => {
        const newSchedules = prevSchedules.filter(s => 
          s.employeeId !== schedule.employeeId || 
          s.date !== schedule.date
        );
        return [...newSchedules, schedule];
      });
      
      // Fermer le modal seulement si demandé
      if (closeModal) {
        setSelectedCell(null);
      }
      
      // Notifier le parent si nécessaire
      if (onScheduleChange) onScheduleChange();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du planning:', error);
    }
  };

  const handleCellClick = (employeeId: string, date: Date) => {
    if (!isStoreClosed(date)) {
      setSelectedCell({ employeeId, date });
    }
  };

  const getWeekNumber = (date: Date): number => {
    // La semaine 1 commence le 30 décembre 2024
    const startOfWeek1 = new Date(2024, 11, 30); // 30 décembre 2024
    
    const diff = date.getTime() - startOfWeek1.getTime();
    const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return weekNumber > 0 ? weekNumber : 52 + weekNumber; // Pour les semaines avant le 30 décembre
  };

  const getAvailableWeeks = () => {
    const weeks: { date: Date; weekNumber: number }[] = [];
    
    // Commencer au 30 décembre 2024 (début de la semaine 1)
    const startDate = new Date(2024, 11, 30);
    // Finir au 28 décembre 2025 (fin de la semaine 52)
    const endDate = new Date(2025, 11, 28);

    let currentWeek = new Date(startDate);
    while (currentWeek <= endDate) {
      weeks.push({
        date: new Date(currentWeek),
        weekNumber: getWeekNumber(currentWeek)
      });
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return weeks;
  };

  const formatWeekOption = (date: Date, weekNumber: number) => {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    
    return `Semaine ${weekNumber} (${formatDateToFrench(date, { day: 'numeric', month: 'long' })} - ${formatDateToFrench(endOfWeek, { day: 'numeric', month: 'long' })})`;
  };

  const handleCopyWeek = async () => {
    try {
      setIsLoading(true);
      
      if (!selectedSourceDate) {
        throw new Error('Aucune semaine source sélectionnée');
      }

      // Calculer la date de début de la semaine source
      const sourceStartDate = new Date(selectedSourceDate);
      // S'assurer que c'est un lundi
      const dayOfWeek = sourceStartDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      sourceStartDate.setDate(sourceStartDate.getDate() + diff);

      console.log('Dates de copie:', {
        sourceStartDate: sourceStartDate.toISOString().split('T')[0],
        targetStartDate: weekDates[0].toISOString().split('T')[0],
        sourceDayOfWeek: sourceStartDate.getDay(),
        targetDayOfWeek: weekDates[0].getDay()
      });

      const result = await copyWeekSchedules(
        sourceStartDate.toISOString().split('T')[0],
        weekDates[0].toISOString().split('T')[0]
      );

      console.log('Résultat de la copie:', result);

      // Recharger les données des deux semaines
      const [sourceWeekData, targetWeekData] = await Promise.all([
        getSchedules(
          sourceStartDate.toISOString().split('T')[0],
          new Date(sourceStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ),
        getSchedules(
          weekDates[0].toISOString().split('T')[0],
          weekDates[6].toISOString().split('T')[0]
        )
      ]);

      // Mettre à jour les données
      setSchedules(targetWeekData);
      
      // Recharger les horaires d'ouverture
      if (onScheduleChange) {
        onScheduleChange();
      }

      setShowCopyModal(false);
      setSelectedSourceDate(null);
    } catch (error: any) {
      console.error('Erreur détaillée lors de la copie de la semaine:', error);
      let message = 'Une erreur est survenue lors de la copie de la semaine';
      
      if (error.message) {
        message += ': ' + error.message;
      }
      
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWeek = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette semaine ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const startDate = weekDates[0].toISOString().split('T')[0];
      await deleteWeekSchedules(startDate);
      
      // Recharger les données
      await loadSchedules();
      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la semaine:', error);
      alert('Une erreur est survenue lors de la suppression de la semaine');
    } finally {
      setIsLoading(false);
    }
  };

  // Exposer les méthodes via la ref
  React.useImperativeHandle(ref, () => ({
    handleCopyWeek: () => setShowCopyModal(true),
    handleDeleteWeek
  }));

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!employees.length) {
    return null;
  }

  return (
    <>
      <table ref={tableRef} className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="p-4 text-left">Employé</th>
            {weekDates.map((date) => {
              const defaultHours = getDefaultStoreHours(date);

              return (
                <th key={date.toISOString()} className="p-4 text-center">
                  <div>{formatDateToFrench(date, { weekday: 'long', day: 'numeric' })}</div>
                  <StoreHoursCell
                    date={date}
                    defaultHours={defaultHours}
                    storeHours={storeHours}
                    onStoreHoursChange={(newStoreHours) => {
                      setStoreHours(newStoreHours);
                      if (onScheduleChange) onScheduleChange();
                    }}
                  />
                </th>
              );
            })}
            <th className="p-4 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={9} className="pb-4">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowCopyModal(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Copy size={16} />
                  Copier la semaine
                </button>
                <button
                  onClick={handleDeleteWeek}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Supprimer la semaine
                </button>
              </div>
            </td>
          </tr>

          {employees.map((employee, index) => (
            <tr key={employee.id} className={`border-t border-b border-gray-200 ${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
              <td className="p-4">
                <span className="font-medium">{employee.name}</span>
              </td>
              {weekDates.map((date) => {
                const schedule = getScheduleForCell(employee.id, date);
                const timeSlot = timeSlots.find((ts) => ts.id === schedule.timeSlotId);
                const absenceType = absenceTypes.find((at) => at.id === schedule.absenceTypeId);
                const closed = isStoreClosed(date);

                return (
                  <td
                    key={date.toISOString()}
                    className={`p-4 text-center ${
                      closed 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-blue-500 hover:text-white'
                    }`}
                    onClick={() => !closed && handleCellClick(employee.id, date)}
                  >
                    {!closed && (
                      schedule?.isPresent ? (
                        schedule?.timeSlotId ? (
                          <span className="text-black">
                            {formatTimeForDisplay(timeSlot?.start || '')} - {formatTimeForDisplay(timeSlot?.end || '')}
                          </span>
                        ) : null
                      ) : (
                        absenceType && (
                          <span className="text-black">
                            {absenceType.label}
                          </span>
                        )
                      )
                    )}
                  </td>
                );
              })}
              <td className="p-4 text-right font-medium">
                {calculateWeeklyTotal(employee.id)}h
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCell && (
        <ScheduleModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          onPrevious={() => {
            const currentIndex = weekDates.findIndex(d => d.getTime() === selectedCell.date.getTime());
            if (currentIndex > 0) {
              const newDate = weekDates[currentIndex - 1];
              setSelectedCell({
                ...selectedCell,
                date: newDate
              });
            }
          }}
          onNext={() => {
            const currentIndex = weekDates.findIndex(d => d.getTime() === selectedCell.date.getTime());
            if (currentIndex < weekDates.length - 1) {
              const newDate = weekDates[currentIndex + 1];
              setSelectedCell({
                ...selectedCell,
                date: newDate
              });
            }
          }}
          onSave={(data) => {
            const schedule = {
              ...data,
              employeeId: selectedCell.employeeId,
              date: selectedCell.date.toISOString().split('T')[0],
            };
            handleScheduleChange(schedule, false);
          }}
          date={selectedCell.date}
          employeeName={employees.find(e => e.id === selectedCell.employeeId)?.name || ''}
          timeSlots={timeSlots}
          absenceTypes={absenceTypes}
          currentSchedule={getScheduleForCell(selectedCell.employeeId, selectedCell.date)}
        />
      )}

      {showCopyModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Copier une semaine</h2>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setSelectedSourceDate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Sélectionnez la semaine à copier vers la semaine du {formatDateToFrench(weekDates[0], { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="sourceWeek" className="block text-sm font-medium text-gray-700 mb-1">
                    Sélectionner la semaine source
                  </label>
                  <select
                    id="sourceWeek"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      setSelectedSourceDate(selectedDate);
                    }}
                    value={selectedSourceDate ? selectedSourceDate.toISOString() : ''}
                  >
                    <option value="">Sélectionnez une semaine</option>
                    {getAvailableWeeks().map(({ date, weekNumber }) => (
                      <option key={date.toISOString()} value={date.toISOString()}>
                        {formatWeekOption(date, weekNumber)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowCopyModal(false);
                      setSelectedSourceDate(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCopyWeek}
                    disabled={!selectedSourceDate || isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Copie en cours...' : 'Copier la semaine'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});