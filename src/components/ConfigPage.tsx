import EmployeesList from './config/EmployeesList';
import TimeSlotsList from './config/TimeSlotsList';
import AbsenceTypesList from './config/AbsenceTypesList';
import StoresList from './config/StoresList';

export default function ConfigPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Configuration</h1>
      <StoresList />
      <EmployeesList />
      <TimeSlotsList />
      <AbsenceTypesList />
    </div>
  );
}