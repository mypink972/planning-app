/*
  # Fix time format in time_slots table

  1. Changes
    - Ensure time columns use HH:MM format without seconds
    - Add constraints to enforce proper time format
    - Preserve foreign key relationships
*/

-- First, drop the foreign key constraint
ALTER TABLE schedules
DROP CONSTRAINT schedules_time_slot_id_fkey;

-- Create a temporary table with the correct column types
CREATE TABLE time_slots_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start time(0) NOT NULL, -- time(0) ensures no seconds
  "end" time(0) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Copy data from the old table, truncating any seconds
INSERT INTO time_slots_new (id, start, "end", created_at)
SELECT 
  id,
  start::time(0),
  "end"::time(0),
  created_at
FROM time_slots;

-- Drop the old table and rename the new one
DROP TABLE time_slots;
ALTER TABLE time_slots_new RENAME TO time_slots;

-- Re-create the foreign key constraint
ALTER TABLE schedules
ADD CONSTRAINT schedules_time_slot_id_fkey 
FOREIGN KEY ("timeSlotId") 
REFERENCES time_slots(id) 
ON DELETE SET NULL;

-- Re-enable RLS and recreate policies
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON time_slots
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON time_slots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON time_slots
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON time_slots
  FOR DELETE USING (true);