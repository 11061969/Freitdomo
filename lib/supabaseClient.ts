import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://xagoliqubafmdhkhtwpm.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZ29saXF1YmFmbWRoa2h0d3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNzMzMzEsImV4cCI6MjEwNDY0OTMzMX0.S3btsiWgbcXtCs0BXNEysIFDFio_cvzIwK5O4jrOjFo"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
