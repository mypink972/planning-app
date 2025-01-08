import { useState, useEffect } from 'react';
import type { Employee, Schedule, TimeSlot } from '../../types';
import { calculateTotalHours, formatDateToFrench } from '../../utils/dates';
import { getEmployees } from '../../services/employees';
import { getTimeSlots } from '../../services/timeSlots';
import { getSchedules } from '../../services/schedules';

interface MonthlyTotalProps {
  currentDate: Date;
  storeHours: {
    date: string;
    isClosed: boolean;
    timeSlotId?: string;
  }[];
  scheduleUpdateCounter: number;
}

export default function MonthlyTotal({ currentDate, storeHours, scheduleUpdateCounter }: MonthlyTotalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Recharger les données quand la date, les horaires du magasin ou les plannings changent
  useEffect(() => {
    loadData();
  }, [currentDate, storeHours, scheduleUpdateCounter]);

  async function loadData() {
    try {
      const [employeesData, timeSlotsData] = await Promise.all([
        getEmployees(),
        getTimeSlots(),
      ]);

      setEmployees(employeesData);
      setTimeSlots(timeSlotsData);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const schedulesData = await getSchedules(
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }

  const calculateMonthlyTotal = (employeeId: string) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return schedules
      .filter((schedule) => {
        const scheduleDate = new Date(schedule.date);
        const isStoreClosed = storeHours.some(
          (sh) => sh.date === schedule.date && sh.isClosed
        );

        return (
          schedule.employeeId === employeeId &&
          scheduleDate.getFullYear() === year &&
          scheduleDate.getMonth() === month &&
          schedule.isPresent &&
          schedule.timeSlotId &&
          !isStoreClosed
        );
      })
      .reduce((total, schedule) => {
        const timeSlot = timeSlots.find((ts) => ts.id === schedule.timeSlotId);
        return total + calculateTotalHours(timeSlot);
      }, 0);
  };

  if (!employees.length) return null;

  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">
        Total des heures - {formatDateToFrench(currentDate, { month: 'long', year: 'numeric' })}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="p-4 border rounded-lg flex justify-between items-center bg-gray-50"
          >
            <span className="font-medium">{employee.name}</span>
            <span className="text-lg font-semibold">
              {calculateMonthlyTotal(employee.id)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}