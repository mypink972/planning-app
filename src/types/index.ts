export interface Employee {
  id: string;
  name: string;
  email?: string;
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
}

export interface StoreHours {
  date: string;
  isClosed: boolean;
  timeSlotId?: string;
}