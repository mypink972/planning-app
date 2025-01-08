/*
  # Schéma initial pour le planning de magasin

  1. Nouvelles Tables
    - `employees` : Stockage des employés
      - `id` (uuid, clé primaire)
      - `name` (text, nom de l'employé)
      - `email` (text, optionnel)
      - `is_joker` (boolean)
      - `created_at` (timestamp)
    
    - `time_slots` : Plages horaires prédéfinies
      - `id` (uuid, clé primaire)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamp)
    
    - `absence_types` : Types d'absence
      - `id` (uuid, clé primaire)
      - `label` (text)
      - `created_at` (timestamp)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques permettant la lecture/écriture pour les utilisateurs authentifiés
*/

-- Création de la table employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  is_joker boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON employees
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Création de la table time_slots
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON time_slots
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Création de la table absence_types
CREATE TABLE IF NOT EXISTS absence_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE absence_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON absence_types
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);