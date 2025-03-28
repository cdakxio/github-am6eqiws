import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.clt-concept.be';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0MjI5ODA2MCwiZXhwIjo0ODk3OTcxNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.0TaksJ7ysMlAOxnGwPdcme2x5Jn5wlVgQxQCMFrzwYI';

export const supabase = createClient(supabaseUrl, supabaseKey);