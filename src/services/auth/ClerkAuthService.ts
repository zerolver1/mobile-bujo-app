// Clerk Authentication Integration for BuJo App
// This service integrates Clerk auth with Supabase and handles guest->user migration

import { supabase } from '../supabase/client';
import { bujoSyncService } from '../supabase/BuJoSyncService';

export class ClerkAuthService {
  
  // Initialize Clerk auth (placeholder for actual Clerk integration)
  async initialize() {
    console.log('🔐 Initializing Clerk authentication...');
    
    // TODO: Initialize Clerk SDK
    // import { ClerkProvider, useAuth } from '@clerk/expo';
    
    // Listen for Clerk auth state changes
    // this.setupAuthStateListener();
  }

  // Sign up new user with Clerk
  async signUp(email: string, password: string) {
    console.log('📝 Starting Clerk sign up process...');
    
    try {
      // TODO: Implement Clerk signup
      // const { user } = await clerk.signUp({ emailAddress: email, password });
      
      // For now, create a mock user in Supabase auth
      const mockUser = {
        id: `clerk-user-${Date.now()}`,
        email: email,
        user_metadata: { 
          source: 'clerk',
          created_at: new Date().toISOString()
        }
      };

      // Create corresponding Supabase auth user (if needed)
      // await this.createSupabaseUser(mockUser);

      console.log('✅ User signed up successfully');
      return mockUser;
      
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn(email: string, password: string) {
    console.log('🔑 Starting Clerk sign in process...');
    
    try {
      // TODO: Implement Clerk signin
      // const { user } = await clerk.signIn({ emailAddress: email, password });
      
      // Mock sign in
      const mockUser = {
        id: `clerk-user-existing`,
        email: email,
      };

      console.log('✅ User signed in successfully');
      return mockUser;
      
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  // Sign out user
  async signOut() {
    console.log('🚪 Signing out user...');
    
    try {
      // TODO: Implement Clerk signout
      // await clerk.signOut();
      
      // Also sign out of Supabase if needed
      if (supabase) {
        await supabase.auth.signOut();
      }

      console.log('✅ User signed out successfully');
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  // Get current authenticated user
  async getCurrentUser() {
    try {
      // TODO: Get user from Clerk
      // const user = await clerk.user;
      
      // For now, check Supabase
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  // Setup auth state listener (integrates with BuJo sync service)
  private setupAuthStateListener() {
    // TODO: Listen to Clerk auth state changes
    // clerk.addListener((event) => {
    //   switch (event.type) {
    //     case 'session-created':
    //       this.handleUserSignedIn(event.user);
    //       break;
    //     case 'session-removed':
    //       this.handleUserSignedOut();
    //       break;
    //   }
    // });

    // For now, use Supabase auth state
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          this.handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.handleUserSignedOut();
        }
      });
    }
  }

  // Handle user signed in
  private async handleUserSignedIn(user: any) {
    console.log('🎉 User authenticated:', user.email);
    
    // The BuJoSyncService will automatically handle:
    // 1. Migrating guest data to authenticated user
    // 2. Creating user profile in Supabase
    // 3. Starting sync
  }

  // Handle user signed out
  private async handleUserSignedOut() {
    console.log('👋 User signed out - switching to guest mode');
    
    // The BuJoSyncService will automatically handle:
    // 1. Creating new guest user
    // 2. Continuing with local data
  }

  // Create Supabase user (if using Supabase auth alongside Clerk)
  private async createSupabaseUser(clerkUser: any) {
    if (!supabase) return;

    try {
      // Create auth user in Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email: clerkUser.email,
        user_metadata: {
          clerk_user_id: clerkUser.id,
          source: 'clerk',
        },
      });

      if (error) {
        console.error('Failed to create Supabase user:', error);
      } else {
        console.log('✅ Supabase user created');
      }

      return data?.user;

    } catch (error) {
      console.error('Error creating Supabase user:', error);
    }
  }
}

// Export singleton instance
export const clerkAuthService = new ClerkAuthService();

// Auth hook for React components
export function useAuth() {
  // TODO: Return actual Clerk useAuth hook
  // return useAuth();
  
  // Mock auth state for now
  return {
    isSignedIn: false,
    user: null,
    signIn: clerkAuthService.signIn.bind(clerkAuthService),
    signUp: clerkAuthService.signUp.bind(clerkAuthService),
    signOut: clerkAuthService.signOut.bind(clerkAuthService),
  };
}