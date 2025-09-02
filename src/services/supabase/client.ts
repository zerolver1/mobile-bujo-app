import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './types';

// Environment variables with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Cloud sync will be disabled.');
}

// Create Supabase client with React Native AsyncStorage
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'bujo-app',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Feature flags from environment
export const features = {
  cloudSync: process.env.EXPO_PUBLIC_ENABLE_CLOUD_SYNC === 'true',
  realtime: process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true',
  syncInterval: parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL_MS || '300000', 10),
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
};

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signOut();
  },

  getSession: async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  getUser: async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) return { unsubscribe: () => {} };
    return supabase.auth.onAuthStateChange(callback).data.subscription;
  },
};

// Storage helpers for images
export const storage = {
  uploadImage: async (bucket: string, path: string, file: Blob | File) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.storage.from(bucket).upload(path, file);
  },

  getPublicUrl: (bucket: string, path: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  deleteImage: async (bucket: string, path: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.storage.from(bucket).remove([path]);
  },
};

export default supabase;