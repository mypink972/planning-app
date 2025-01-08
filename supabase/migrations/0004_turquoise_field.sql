/*
  # Correction des noms de colonnes

  1. Changements
    - Renommage des colonnes dans la table schedules pour correspondre au code
    - Renommage des colonnes dans la table time_slots pour correspondre au code

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Renommage des colonnes dans la table schedules
ALTER TABLE schedules 
  RENAME COLUMN is_present TO "isPresent";

ALTER TABLE schedules 
  RENAME COLUMN time_slot_id TO "timeSlotId";

ALTER TABLE schedules 
  RENAME COLUMN absence_type_id TO "absenceTypeId";

ALTER TABLE schedules 
  RENAME COLUMN employee_id TO "employeeId";

-- Renommage des colonnes dans la table time_slots
ALTER TABLE time_slots 
  RENAME COLUMN start_time TO start;

ALTER TABLE time_slots 
  RENAME COLUMN end_time TO "end";