import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Mail } from 'lucide-react';
import { getWeekDates, getWeekNumber, formatDateToFrench } from '../utils/dates';
import { exportTableToPDF } from '../utils/pdf';
import WeeklySchedule from './planning/WeeklySchedule';
import StoreHoursCell from './planning/StoreHoursCell';
import MonthlyTotal from './planning/MonthlyTotal';
import type { StoreHours } from '../types/storeHours';
import { getStoreHoursByWeek, upsertStoreHours, deleteStoreHours } from '../services/storeHoursService';
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
      await deleteStoreHours(dateStr);
      setStoreHours((prev) => prev.filter((sh) => sh.date !== dateStr));
      return;
    }
    
    const storeHoursInput = {
      date: dateStr,
      isClosed: value === 'closed',
      timeSlotId: value === 'closed' ? undefined : value
    };
    
    const result = await upsertStoreHours(storeHoursInput);
    if (result) {
      setStoreHours((prev) => {
        const filtered = prev.filter((sh) => sh.date !== dateStr);
        return [...filtered, result];
      });
    }
  };

  const handleScheduleChange = () => {
    setScheduleUpdateCounter(prev => prev + 1);
  };

  const handleSendEmails = async () => {
    if (!tableRef.current) return;
    
    try {
      setSending(true);
      const employees = await getEmployees();
      const pdfBuffer = await exportTableToPDF(tableRef.current, currentDate);
      
      const results = await sendPlanningEmails(pdfBuffer, employees, weekDates[0]);
      
      // Afficher un message de succès/erreur
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        alert(`Planning envoyé avec succès à ${successCount} employé(s).${
          errorCount > 0 ? `\n${errorCount} erreur(s) d'envoi.` : ''
        }`);
      } else if (errorCount > 0) {
        alert('Erreur lors de l\'envoi des emails.');
      } else {
        alert('Aucun employé avec une adresse email n\'a été trouvé.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails:', error);
      alert('Erreur lors de l\'envoi des emails.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FileDown size={20} />
          Exporter en PDF
        </button>
        <button
          onClick={handleSendEmails}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail size={20} />
          {sending ? 'Envoi en cours...' : 'Envoyer par email'}
        </button>
      </div>

      <div className="flex justify-center items-center gap-8 mb-4">
        <button 
          onClick={handlePreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={32} />
        </button>
        <h2 className="text-3xl font-semibold">
          {formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <div className="text-center mb-6">
        <span className="text-2xl text-gray-600">
          Semaine {getWeekNumber(currentDate)}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table ref={tableRef} className="w-full min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4"></th>
              {weekDates.map((date) => (
                <th key={date.toISOString()} className="p-4 text-center font-semibold">
                  <div className="text-sm">
                    {formatDateToFrench(date, { weekday: 'long' })}
                  </div>
                  <div className="text-2xl mt-1">
                    {date.getDate()}
                  </div>
                </th>
              ))}
              <th className="p-4"></th>
            </tr>
            <tr>
              <th className="p-4 text-left font-medium text-gray-500">
                Horaires d'ouverture
              </th>
              {weekDates.map((date) => (
                <th key={date.toISOString()} className="p-4">
                  <StoreHoursCell
                    date={date}
                    value={getStoreHours(date)}
                    onChange={(value) => handleStoreHoursChange(date, value)}
                  />
                </th>
              ))}
              <th className="p-4 text-right font-medium text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            <WeeklySchedule 
              weekDates={weekDates} 
              storeHours={storeHours}
              onScheduleChange={handleScheduleChange} 
            />
          </tbody>
        </table>
      </div>

      <MonthlyTotal 
        currentDate={currentDate} 
        storeHours={storeHours}
        scheduleUpdateCounter={scheduleUpdateCounter}
      />
    </div>
  );
}