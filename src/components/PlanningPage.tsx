import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Mail, Calendar } from 'lucide-react';
import { getWeekDates, getWeekNumber, formatDateToFrench } from '../utils/dates';
import { exportTableToPDF, exportMonthlyPDF } from '../utils/pdf';
import WeeklySchedule from './planning/WeeklySchedule';
import MonthlyTotal from './planning/MonthlyTotal';
import type { StoreHours } from '../types/storeHours';
import type { Store } from '../types';
import { getStoreHoursByWeek } from '../services/storeHoursService';
import { getEmployees, getEmployeesByStore } from '../services/employees';
import { sendPlanningEmails } from '../services/emailService';
import { getStores } from '../services/stores';
import { getMonthlySchedules } from '../services/schedules';
import config from '../config/config';

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [storeHours, setStoreHours] = useState<StoreHours[]>([]);
  const [scheduleUpdateCounter, setScheduleUpdateCounter] = useState(0);
  const [sending, setSending] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const weekDates = getWeekDates(currentDate);
  const tableRef = useRef<HTMLTableElement>(null);
  const weeklyScheduleRef = useRef<{ handleCopyWeek: () => void; handleDeleteWeek: () => void; }>(null);

  useEffect(() => {
    fetchStoreHours();
    loadStores();
  }, [currentDate, scheduleUpdateCounter]);
  
  const loadStores = async () => {
    try {
      const storesData = await getStores();
      setStores(storesData);
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
    }
  };

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
      await exportTableToPDF(tableRef.current, currentDate, true, 'weekly');
    }
  };
  
  const handleExportMonthlyPDF = async () => {
    try {
      // Récupérer les employés
      const employees = await (selectedStoreId ? getEmployeesByStore(selectedStoreId) : getEmployees());
      
      // Récupérer les horaires du mois
      const schedules = await getMonthlySchedules(currentDate);
      
      // Générer le PDF
      await exportMonthlyPDF(schedules, employees, currentDate, true);
    } catch (error) {
      console.error('Erreur lors de l\'export du planning mensuel:', error);
      alert('Erreur lors de l\'export du planning mensuel');
    }
  };

  const handleSendEmails = async () => {
    setSending(true);
    try {
      console.log('Début de l\'envoi des emails...');
      
      // Récupérer les employés
      const employees = await (selectedStoreId ? getEmployeesByStore(selectedStoreId) : getEmployees());
      console.log('Employés récupérés:', employees.length, 'employés');
      
      // Vérifier les emails des employés
      const employeesWithEmail = employees.filter(emp => emp.email);
      console.log('Employés avec email:', employeesWithEmail.length, 'employés');
      
      if (employeesWithEmail.length === 0) {
        alert('Aucun employé n\'a d\'adresse email. Impossible d\'envoyer les plannings.');
        return;
      }
      
      // Récupérer les horaires du mois
      const schedules = await getMonthlySchedules(currentDate);
      console.log('Horaires récupérés:', schedules.length, 'horaires');
      
      // Générer le PDF mensuel sans téléchargement automatique
      console.log('Génération du PDF mensuel...');
      const pdfBuffer = await exportMonthlyPDF(schedules, employees, currentDate, false);
      console.log('PDF généré avec succès, taille:', pdfBuffer.byteLength, 'octets');
      
      // Envoyer les emails avec la vue mensuelle
      console.log('Envoi des emails en cours...');
      console.log('URL de l\'API:', config.apiUrl);
      
      await sendPlanningEmails(pdfBuffer, employeesWithEmail, currentDate);
      console.log('Emails envoyés avec succès!');
      alert('Emails envoyés avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails:', error);
      alert(`Erreur lors de l'envoi des emails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
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
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <option value="">Tous les magasins</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FileDown className="w-4 h-4" />
              PDF Semaine
            </button>
            <button
              onClick={handleExportMonthlyPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4" />
              PDF Mois
            </button>
          </div>
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
            onStoreHoursChange={handleStoreHoursChange}
            selectedStoreId={selectedStoreId}
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