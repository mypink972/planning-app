import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Mail } from 'lucide-react';
import { getWeekDates, getWeekNumber, formatDateToFrench } from '../utils/dates';
import { exportTableToPDF } from '../utils/pdf';
import WeeklySchedule from './planning/WeeklySchedule';
import MonthlyTotal from './planning/MonthlyTotal';
import type { StoreHours } from '../types/storeHours';
import { getStoreHoursByWeek } from '../services/storeHoursService';
import { getEmployees } from '../services/employees';
import { sendPlanningEmails } from '../services/emailService';

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [storeHours, setStoreHours] = useState<StoreHours[]>([]);
  const [scheduleUpdateCounter, setScheduleUpdateCounter] = useState(0);
  const [sending, setSending] = useState(false);
  const weekDates = getWeekDates(currentDate);
  const tableRef = useRef<HTMLTableElement>(null);
  const weeklyScheduleRef = useRef<{ handleCopyWeek: () => void; handleDeleteWeek: () => void; }>(null);

  useEffect(() => {
    fetchStoreHours();
  }, [currentDate, scheduleUpdateCounter]);

  const fetchStoreHours = async () => {
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    const hours = await getStoreHoursByWeek(startDate, endDate);
    setStoreHours(hours);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleExportPDF = async () => {
    if (tableRef.current) {
      await exportTableToPDF(tableRef.current, currentDate);
    }
  };

  const handleSendEmails = async () => {
    setSending(true);
    try {
      if (!tableRef.current) {
        throw new Error('La référence de la table est invalide');
      }

      // Générer le PDF
      const pdfData = await exportTableToPDF(tableRef.current, currentDate);
      
      // Récupérer la liste des employés
      const employees = await getEmployees();
      
      // Vérifier que nous avons une date valide
      const weekStartDate = weekDates[0] || currentDate;
      
      // Envoyer les emails
      await sendPlanningEmails(pdfData, employees, weekStartDate);
      alert('Emails envoyés avec succès !');
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Erreur lors de l\'envoi des emails');
    } finally {
      setSending(false);
    }
  };

  const getStoreHours = (date: Date) => {
    const found = storeHours.find(
      (sh) => sh.date === date.toISOString().split('T')[0]
    );
    if (!found) return '';
    return found.isClosed ? 'closed' : (found.timeSlotId || '');
  };

  const handleStoreHoursChange = async (date: Date, value: string) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (value === '') {
      // await deleteStoreHours(dateStr);
      setStoreHours((prev) => prev.filter((sh) => sh.date !== dateStr));
      return;
    }
    
    const storeHoursInput = {
      date: dateStr,
      isClosed: value === 'closed',
      timeSlotId: value === 'closed' ? undefined : value
    };
    
    // const result = await upsertStoreHours(storeHoursInput);
    // if (result) {
    setStoreHours((prev) => {
      const filtered = prev.filter((sh) => sh.date !== dateStr);
      return [...filtered, storeHoursInput];
    });
    // }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">
            Semaine {getWeekNumber(currentDate)}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl font-semibold">
          {formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4" />
            Exporter en PDF
          </button>
          <button
            onClick={handleSendEmails}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {sending ? 'Envoi en cours...' : 'Envoyer par email'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow">
          <WeeklySchedule
            ref={weeklyScheduleRef}
            weekDates={weekDates}
            storeHours={storeHours}
            onScheduleChange={() => setScheduleUpdateCounter(c => c + 1)}
            tableRef={tableRef}
            getStoreHours={getStoreHours}
            handleStoreHoursChange={handleStoreHoursChange}
          />
        </div>

        <div className="mt-4">
          <MonthlyTotal 
            currentDate={currentDate} 
            storeHours={storeHours}
            scheduleUpdateCounter={scheduleUpdateCounter}
          />
        </div>
      </div>
    </div>
  );
}