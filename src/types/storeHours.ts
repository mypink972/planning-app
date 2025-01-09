export interface StoreHours {
  id?: number;
  date: string;
  isClosed: boolean;
  timeSlotId?: string;
}

export type StoreHoursInput = Omit<StoreHours, 'id'>;
