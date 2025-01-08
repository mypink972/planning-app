/*
  # Ajout de la table des plannings

  1. Nouvelle Table
    - `schedules`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `date` (date)
      - `is_present` (boolean)
      - `time_slot_id` (uuid, foreign key vers time_slots, optionnel)
      - `absence_type_id` (uuid, foreign key vers absence_types, optionnel)
      - `created_at` (timestamptz)

  2. Contraintes
    - Clés étrangères vers employees, time_slots et absence_types
    - Contrainte unique sur employee_id + date pour éviter les doublons
    
  3. Sécurité
    - Enable RLS
    - Politiques CRUD pour tous les utilisateurs
*/

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_present boolean NOT NULL DEFAULT true,
  time_slot_id uuid REFERENCES time_slots(id) ON DELETE SET NULL,
  absence_type_id uuid REFERENCES absence_types(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Enable read access for all users" ON schedules
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON schedules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON schedules
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON schedules
  FOR DELETE USING (true);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS schedules_employee_id_date_idx ON schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS schedules_date_idx ON schedules(date);