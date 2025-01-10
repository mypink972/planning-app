import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { TimeSlot, AbsenceType } from '../../types';
import { formatTimeForDisplay } from '../../utils/time';
import Draggable from 'react-draggable';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSave: (data: { isPresent: boolean; timeSlotId?: string; absenceTypeId?: string }) => void;
  date: Date;
  employeeName: string;
  timeSlots: TimeSlot[];
  absenceTypes: AbsenceType[];
  currentSchedule: {
    isPresent: boolean;
    timeSlotId?: string;
    absenceTypeId?: string;
  };
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onPrevious,
  onNext,
  onSave,
  date,
  employeeName,
  timeSlots,
  absenceTypes,
  currentSchedule,
}: ScheduleModalProps) {
  const [isPresent, setIsPresent] = React.useState(currentSchedule.isPresent);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState(currentSchedule.timeSlotId || '');
  const [selectedAbsenceType, setSelectedAbsenceType] = React.useState(currentSchedule.absenceTypeId || '');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPresent(currentSchedule.isPresent);
    setSelectedTimeSlot(currentSchedule.timeSlotId || '');
    setSelectedAbsenceType(currentSchedule.absenceTypeId || '');
  }, [currentSchedule]);

  if (!isOpen) return null;

  const saveData = () => {
    onSave({
      isPresent,
      timeSlotId: selectedTimeSlot || undefined,
      absenceTypeId: selectedAbsenceType || undefined,
    });
  };

  const handleSave = () => {
    saveData();
    onClose();
  };

  const handlePrevious = () => {
    saveData();
    onPrevious();
  };

  const handleNext = () => {
    saveData();
    onNext();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Draggable handle=".modal-header" bounds="parent" nodeRef={modalRef}>
        <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-[32rem]">
          <div className="modal-header flex justify-between items-center p-4 cursor-move border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {employeeName} - {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={(e) => setIsPresent(e.target.checked)}
                  className="w-4 h-4"
                />
                Présent
              </label>
            </div>

            {isPresent ? (
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              >
                <option value="">Sélectionner un horaire</option>
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatTimeForDisplay(slot.start)} - {formatTimeForDisplay(slot.end)}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedAbsenceType}
                onChange={(e) => setSelectedAbsenceType(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              >
                <option value="">Sélectionner un type d'absence</option>
                {absenceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-between gap-2">
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Précédent
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Enregistrer
                </button>
              </div>
              <button
                onClick={handleNext}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
}