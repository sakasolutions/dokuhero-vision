-- Schritt 2: FK auf auth.users entfernen (Google-OAuth-User existieren nicht in auth.users)
-- Constraint-Name ggf. im Dashboard unter Table Editor > users > Constraints prüfen.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Schritt 3: Explizite Policy für service_role (hilfreich wenn RLS dennoch greift)
-- Hinweis: Bei Standard-Supabase umgeht der Service-Role-Key RLS oft bereits via JWT-Rolle.
DROP POLICY IF EXISTS service_role_bypass ON public.users;
CREATE POLICY service_role_bypass ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
