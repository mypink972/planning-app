export interface StoreHours {
  id?: string;
  date: string;
  isClosed: boolean;
  timeSlotId?: string;
}

export interface StoreHoursInput {
  date: string;
  isClosed: boolean;
  timeSlotId?: string;
}
