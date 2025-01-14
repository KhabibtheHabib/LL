import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role?: 'student' | 'employee';
  studentId?: string;
  fullName?: string;
  isDemo?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, studentId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  employeeSignIn: (email: string, password: string) => Promise<void>;
  startDemoSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signIn: async (email, password) => {
    try {
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: profile.role || 'student',
          studentId: profile.student_id,
          fullName: profile.full_name
        }
      });
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  },
  signUp: async (email, password, fullName, studentId) => {
    try {
      // Create auth user with metadata
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId
          }
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('User already registered')) {
          throw new Error('An account with this email already exists');
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Failed to create account');
      }

      // The trigger will create the initial profile
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      set({
        user: {
          id: data.user.id,
          email,
          role: 'student',
          studentId,
          fullName
        }
      });
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('duplicate key')) {
        throw new Error('An account with this email already exists');
      }
      throw error;
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  employeeSignIn: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Verify employee role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .eq('role', 'employee')
      .single();

    if (profileError || !profile) {
      throw new Error('Unauthorized access');
    }

    set({
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: 'employee',
        fullName: profile.full_name
      }
    });
  },
  startDemoSession: () => {
    set({
      user: {
        id: 'demo-user',
        email: 'demo@example.com',
        role: 'student',
        fullName: 'Demo User',
        studentId: '12345678',
        isDemo: true
      }
    });
  }
}));