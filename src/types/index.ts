export interface Store {
  id: string;
  name: string;
  address?: string;
}

// Interface pour les données brutes de l'employé provenant de la base de données
export interface EmployeeRaw {
  id: string;
  name: string;
  email?: string;
  store_id?: string;
  store?: Store;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  storeId?: string;
  store?: Store;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

export interface AbsenceType {
  id: string;
  label: string;
}

export interface Schedule {
  id?: string;
  employeeId: string;
  date: string;
  isPresent: boolean;
  timeSlotId?: string;
  absenceTypeId?: string;
  hours?: number;
  isAbsence?: boolean;
}

export interface StoreHours {
  date: string;
  isClosed: boolean;
  timeSlotId?: string;
}