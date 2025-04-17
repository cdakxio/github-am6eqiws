/*
  # Simulation Data Migration

  1. Purpose
    - Create realistic test data for development and testing
    - Populate all main tables with related data
    - Ensure data consistency and relationships

  2. Data Generation
    - 50 participants (mix of regular and responsible)
    - 10 formateurs (trainers)
    - 15 lieux (locations)
    - 30 formations (mix of past and future)
    - Formation participants with various statuses
    - Ratings for past formations
*/

-- Function to generate random dates within a range
CREATE OR REPLACE FUNCTION random_date(start_date date, end_date date)
RETURNS date AS $$
BEGIN
  RETURN start_date + (random() * (end_date - start_date))::integer;
END;
$$ LANGUAGE plpgsql;

-- Insert test data
DO $$
DECLARE
  v_user_id uuid;
  v_formateur_id uuid;
  v_lieu_id uuid;
  v_formation_id uuid;
  v_participant_id uuid;
  v_institution_types text[] := ARRAY['École', 'Université', 'Centre de formation', 'Association', 'Entreprise', 'Administration publique'];
  v_formation_types text[] := ARRAY['standard', 'institut'];
BEGIN
  -- Get a valid user ID (using the first available user)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users';
  END IF;

  -- Insert formateurs
  FOR i IN 1..10 LOOP
    INSERT INTO formateurs (
      nom,
      prenom,
      email,
      telephone,
      adresse,
      code_postal,
      ville,
      created_by
    ) VALUES (
      'Nom' || i,
      'Prénom' || i,
      'formateur' || i || '@example.com',
      '0' || (600000000 + i)::text,
      i || ' Rue des Formateurs',
      (10000 + i)::text,
      'Ville' || (i % 5 + 1),
      v_user_id
    );
  END LOOP;

  -- Insert lieux
  FOR i IN 1..15 LOOP
    INSERT INTO lieux (
      nom,
      type,
      adresse,
      code_postal,
      ville,
      telephone,
      email,
      created_by
    ) VALUES (
      'Centre de Formation ' || i,
      v_institution_types[1 + (i % array_length(v_institution_types, 1))],
      i || ' Avenue des Centres',
      (20000 + i)::text,
      'Ville' || (i % 8 + 1),
      '0' || (700000000 + i)::text,
      'centre' || i || '@example.com',
      v_user_id
    );
  END LOOP;

  -- Insert participants (mix of regular and responsible)
  FOR i IN 1..50 LOOP
    INSERT INTO participants (
      prenom,
      nom,
      telephone,
      email,
      fonction,
      is_responsable,
      type_institution,
      nom_institution,
      rue,
      code_postal,
      ville,
      telephone_institution,
      created_by
    ) VALUES (
      'Prénom' || i,
      'Nom' || i,
      '0' || (800000000 + i)::text,
      'participant' || i || '@example.com',
      CASE WHEN i % 3 = 0 THEN 'Directeur' WHEN i % 3 = 1 THEN 'Responsable' ELSE 'Participant' END,
      i % 4 = 0, -- 25% are responsables
      CASE WHEN i % 4 = 0 THEN v_institution_types[1 + (i % array_length(v_institution_types, 1))] ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN 'Institution ' || i ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN i || ' Rue des Institutions' ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN (30000 + i)::text ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN 'Ville' || (i % 10 + 1) ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN '0' || (900000000 + i)::text ELSE NULL END,
      v_user_id
    );
  END LOOP;

  -- Insert formations (mix of past and future)
  FOR i IN 1..30 LOOP
    -- Select random lieu
    SELECT id INTO v_lieu_id FROM lieux ORDER BY random() LIMIT 1;
    
    INSERT INTO formations (
      titre,
      lieu_id,
      categorie,
      date,
      nombre_heures,
      nombre_places,
      url_visio,
      telephone,
      email,
      type,
      rating,
      created_by
    ) VALUES (
      'Formation ' || i || ': ' || CASE 
        WHEN i % 4 = 0 THEN 'Management'
        WHEN i % 4 = 1 THEN 'Communication'
        WHEN i % 4 = 2 THEN 'Leadership'
        ELSE 'Innovation'
      END,
      v_lieu_id,
      CASE 
        WHEN i % 4 = 0 THEN 'Management'
        WHEN i % 4 = 1 THEN 'Communication'
        WHEN i % 4 = 2 THEN 'Leadership'
        ELSE 'Innovation'
      END,
      CASE 
        WHEN i % 2 = 0 THEN random_date(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '1 day')
        ELSE random_date(CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '6 months')
      END,
      CASE 
        WHEN i % 3 = 0 THEN 4
        WHEN i % 3 = 1 THEN 7
        ELSE 14
      END,
      CASE 
        WHEN i % 5 = 0 THEN NULL -- 20% have unlimited places
        ELSE 10 + (i % 15) -- 10-25 places
      END,
      'https://meet.example.com/formation-' || i,
      '0' || (1000000000 + i)::text,
      'formation' || i || '@example.com',
      v_formation_types[1 + (i % array_length(v_formation_types, 1))],
      CASE 
        WHEN i % 2 = 0 THEN 65 + (random() * 35)::integer -- Past formations have ratings
        ELSE 0 -- Future formations have 0 rating
      END,
      v_user_id
    ) RETURNING id INTO v_formation_id;

    -- Assign 1-2 random formateurs
    FOR j IN 1..2 LOOP
      SELECT id INTO v_formateur_id FROM formateurs ORDER BY random() LIMIT 1;
      INSERT INTO formation_formateurs (formation_id, formateur_id, created_by)
      VALUES (v_formation_id, v_formateur_id, v_user_id)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Add 5-15 random participants
    FOR j IN 1..(5 + (random() * 10)::integer) LOOP
      SELECT id INTO v_participant_id FROM participants ORDER BY random() LIMIT 1;
      INSERT INTO formation_participants (
        formation_id,
        participant_id,
        statut,
        created_by
      ) VALUES (
        v_formation_id,
        v_participant_id,
        CASE 
          WHEN i % 2 = 0 THEN -- Past formations
            CASE 
              WHEN random() < 0.7 THEN 'paid'
              WHEN random() < 0.9 THEN 'confirmed'
              ELSE 'pending'
            END
          ELSE -- Future formations
            CASE 
              WHEN random() < 0.4 THEN 'paid'
              WHEN random() < 0.7 THEN 'confirmed'
              ELSE 'pending'
            END
        END,
        v_user_id
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;