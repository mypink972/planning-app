/*
  # Correction des politiques RLS

  1. Sécurité
    - Mise à jour des politiques RLS pour permettre l'accès public en lecture
    - Ajout de politiques pour les opérations d'insertion et de mise à jour
*/

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON time_slots;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON absence_types;

-- Nouvelles politiques pour la table employees
CREATE POLICY "Enable read access for all users" ON employees
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON employees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON employees
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON employees
  FOR DELETE USING (true);

-- Nouvelles politiques pour la table time_slots
CREATE POLICY "Enable read access for all users" ON time_slots
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON time_slots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON time_slots
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON time_slots
  FOR DELETE USING (true);

-- Nouvelles politiques pour la table absence_types
CREATE POLICY "Enable read access for all users" ON absence_types
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON absence_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON absence_types
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON absence_types
  FOR DELETE USING (true);