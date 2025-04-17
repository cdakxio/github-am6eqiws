import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.ia-temis.be/';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NDExOTA2MCwiZXhwIjo0ODk5NzkyNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.mn0iGK1pOViIHu9Dlh2D24nuXKmY3NZxM1b0zka-0NU';

export const supabase = createClient(supabaseUrl, supabaseKey);