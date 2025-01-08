import React from 'react';
import EmployeesList from './config/EmployeesList';
import TimeSlotsList from './config/TimeSlotsList';
import AbsenceTypesList from './config/AbsenceTypesList';

export default function ConfigPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Configuration</h1>
      <EmployeesList />
      <TimeSlotsList />
      <AbsenceTypesList />
    </div>
  );
}