import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Mail, Calendar, X } from 'lucide-react';
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

// Modal pour sélectionner le mois à envoyer par email
function MonthSelectorModal({ isOpen, onClose, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Générer les options pour les mois
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Générer les options pour les années (année actuelle et les 2 années suivantes)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  
  const handleSubmit = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    onSelect(selectedDate);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sélectionner un mois</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
          <select 
            className="w-full p-2 border rounded"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
          <select 
            className="w-full p-2 border rounded"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="mr-2 px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [storeHours, setStoreHours] = useState<StoreHours[]>([]);
  const [scheduleUpdateCounter, setScheduleUpdateCounter] = useState(0);
  const [sending, setSending] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
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

  // Fonction pour ouvrir le modal de sélection de mois
  const openMonthSelector = () => {
    setIsMonthSelectorOpen(true);
  };

  // Fonction pour envoyer les emails avec le mois sélectionné
  const handleSendEmailsForMonth = async (selectedDate: Date) => {
    setSending(true);
    try {
      console.log('Début de l\'envoi des emails pour le mois sélectionné...');
      console.log('Date sélectionnée:', selectedDate);
      
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
      
      // Récupérer les horaires du mois sélectionné
      const schedules = await getMonthlySchedules(selectedDate);
      console.log('Horaires récupérés:', schedules.length, 'horaires');
      
      // Générer le PDF mensuel sans téléchargement automatique
      console.log('Génération du PDF mensuel...');
      const pdfBuffer = await exportMonthlyPDF(schedules, employees, selectedDate, false);
      console.log('PDF généré avec succès, taille:', pdfBuffer.byteLength, 'octets');
      
      // Préparer les informations de date pour l'email
      const monthName = formatDateToFrench(selectedDate, { month: 'long' });
      const year = selectedDate.getFullYear();
      const emailSubject = `Planning mensuel - ${monthName} ${year}`;
      
      // Envoyer les emails avec la vue mensuelle
      console.log('Envoi des emails en cours...');
      console.log('URL de l\'API:', config.apiUrl);
      console.log('Objet de l\'email:', emailSubject);
      
      await sendPlanningEmails(pdfBuffer, employeesWithEmail, selectedDate, {
        subject: emailSubject,
        isMonthly: true,
        month: monthName,
        year: year
      });
      
      console.log('Emails envoyés avec succès!');
      alert(`Emails du planning de ${monthName} ${year} envoyés avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails:', error);
      alert(`Erreur lors de l'envoi des emails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };
  
  // Ancienne fonction pour compatibilité (ouvre maintenant le sélecteur de mois)
  const handleSendEmails = () => {
    openMonthSelector();
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
          
          {/* Modal pour sélectionner le mois */}
          <MonthSelectorModal 
            isOpen={isMonthSelectorOpen} 
            onClose={() => setIsMonthSelectorOpen(false)} 
            onSelect={handleSendEmailsForMonth} 
          />
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