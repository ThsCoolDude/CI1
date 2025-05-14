import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjxcyofuarpdoggwdjge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqeGN5b2Z1YXJwZG9nZ3dkamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzMyNTYsImV4cCI6MjA2Mjc0OTI1Nn0.ciAHrFER3wn6n36E5ZeRarW7ysOjSjWg-aWkivDz9eU';

export const supabase = createClient(supabaseUrl, supabaseKey); 