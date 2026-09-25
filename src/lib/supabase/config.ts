// Public Supabase settings. Both values are safe to expose (the publishable key only works within row-level security,
// and they are already served in /app/config.js). Fallbacks mean sign-in still works if the NEXT_PUBLIC_* variables
// were not set (or not rebuilt) on the host; set them in the host's env to point at another project.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://tahargfmuaskrhchigqv.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "sb_publishable_Xc2rBBYPVPi9tVdworVK_Q_cKJlaqxf";
