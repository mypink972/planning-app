import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Trash2 } from 'lucide-react';
import type { Employee, Schedule, TimeSlot, AbsenceType } from '../../types';
import ScheduleModal from './ScheduleModal';
import { calculateTotalHours } from '../../utils/dates';
import { formatTimeForDisplay } from '../../utils/time';
import { getEmployees } from '../../services/employees';
import { getTimeSlots } from '../../services/timeSlots';
import { getAbsenceTypes } from '../../services/absenceTypes';
import { getSchedules, upsertSchedule, copyWeekSchedules, deleteWeekSchedules } from '../../services/schedules';
import { getDefaultStoreHours } from '../../utils/defaultStoreHours';

interface WeeklyScheduleProps {
  weekDates: Date[];
  storeHours: {
    date: string;
    isClosed: boolean;
    timeSlotId?: string;
  }[];
  onScheduleChange?: () => void;
}

export default forwardRef(function WeeklySchedule(
  { weekDates, storeHours, onScheduleChange }: WeeklyScheduleProps,
  ref
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string;
    date: Date;
  } | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (weekDates.length > 0) {
      loadSchedules();
    }
  }, [weekDates, storeHours]);

  async function loadInitialData() {
    try {
      const [employeesData, timeSlotsData, absenceTypesData] = await Promise.all([
        getEmployees(),
        getTimeSlots(),
        getAbsenceTypes()
      ]);

      setEmployees(employeesData);
      setTimeSlots(timeSlotsData);
      setAbsenceTypes(absenceTypesData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }

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
    // Vérifier d'abord les horaires personnalisés
    const storeHour = storeHours.find(
      (sh) => sh.date === date.toISOString().split('T')[0]
    );
    if (storeHour) return storeHour.isClosed;

    // Si pas d'horaires personnalisés, vérifier les horaires par défaut
    const defaultHours = getDefaultStoreHours(date);
    return defaultHours === 'closed';
  };

  const getScheduleForCell = (employeeId: string, date: Date) => {
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

  const handleScheduleChange = async (schedule: Schedule) => {
    try {
      await upsertSchedule(schedule);
      // Mettre à jour localement au lieu de recharger
      setSchedules(prevSchedules => {
        const newSchedules = prevSchedules.filter(s => 
          s.employeeId !== schedule.employeeId || 
          s.date !== schedule.date
        );
        return [...newSchedules, schedule];
      });
      onScheduleChange?.();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du planning:', error);
    }
  };

  const handleCellClick = (employeeId: string, date: Date) => {
    if (!isStoreClosed(date)) {
      setSelectedCell({ employeeId, date });
    }
  };

  // Fonction pour copier une semaine
  const handleCopyWeek = async (sourceWeekNumber: number) => {
    try {
      setIsLoading(true);
      // Calculer la date de début de la semaine source
      const currentYear = new Date().getFullYear();
      const sourceDate = new Date(currentYear, 0, 1 + (sourceWeekNumber - 1) * 7);
      // Ajuster au lundi de la semaine
      const day = sourceDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      sourceDate.setDate(sourceDate.getDate() + diff);

      const result = await copyWeekSchedules(
        sourceDate.toISOString().split('T')[0],
        weekDates[0].toISOString().split('T')[0]
      );

      // Mettre à jour directement les données locales avec les données insérées
      if (result) {
        setSchedules(result.schedules || []);
      }

      if (onScheduleChange) onScheduleChange();
    } catch (error) {
      console.error('Erreur lors de la copie de la semaine:', error);
    } finally {
      setIsLoading(false);
      setShowCopyModal(false);
    }
  };

  // Fonction pour supprimer une semaine
  const handleDeleteWeek = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les plannings de cette semaine ?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteWeekSchedules(weekDates[0].toISOString().split('T')[0]);
      if (onScheduleChange) onScheduleChange();
      loadSchedules();
    } catch (error) {
      console.error('Erreur lors de la suppression de la semaine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Exposer les méthodes via la ref
  useImperativeHandle(ref, () => ({
    handleCopyWeek: () => {
      setShowCopyModal(true);
    },
    handleDeleteWeek: () => {
      handleDeleteWeek();
    }
  }));

  if (!employees.length) {
    return null;
  }

  return (
    <>
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
                } ${closed ? 'bg-gray-100' : ''}`}
                onClick={() => !closed && handleCellClick(employee.id, date)}
              >
                {!closed && (
                  schedule.isPresent ? (
                    timeSlot ? (
                      <span className="text-black">
                        {formatTimeForDisplay(timeSlot.start)} - {formatTimeForDisplay(timeSlot.end)}
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

      {selectedCell && createPortal(
        <ScheduleModal
          isOpen={true}
          onClose={() => setSelectedCell(null)}
          onPrevious={() => {
            const prevDate = new Date(selectedCell.date);
            prevDate.setDate(prevDate.getDate() - 1);
            if (!isStoreClosed(prevDate)) {
              setSelectedCell({ ...selectedCell, date: prevDate });
            }
          }}
          onNext={() => {
            const nextDate = new Date(selectedCell.date);
            nextDate.setDate(nextDate.getDate() + 1);
            if (!isStoreClosed(nextDate)) {
              setSelectedCell({ ...selectedCell, date: nextDate });
            }
          }}
          onSave={(data) => {
            handleScheduleChange({
              ...data,
              employeeId: selectedCell.employeeId,
              date: selectedCell.date.toISOString().split('T')[0],
            });
            setSelectedCell(null);
          }}
          date={selectedCell.date}
          employeeName={employees.find((e) => e.id === selectedCell.employeeId)?.name || ''}
          timeSlots={timeSlots}
          absenceTypes={absenceTypes}
          currentSchedule={getScheduleForCell(selectedCell.employeeId, selectedCell.date)}
        />,
        document.body
      )}

      {/* Modal de sélection de la semaine cible */}
      {showCopyModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Quelle semaine souhaitez-vous copier ?</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de semaine à copier
              </label>
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => handleCopyWeek(parseInt(e.target.value))}
              >
                <option value="">Sélectionnez une semaine</option>
                {Array.from({ length: 52 }, (_, i) => i + 1).map(weekNum => (
                  <option key={weekNum} value={weekNum}>
                    Semaine {weekNum}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});