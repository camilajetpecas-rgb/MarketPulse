
import { supabase } from './supabase';
import { User } from '../types';

export const authService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      password: '', // Not accessible
      createdAt: p.created_at
    }));
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email || '',
        name: profile?.name || data.user.user_metadata?.name || 'User',
        role: profile?.role || data.user.user_metadata?.role || 'user',
        password: '',
        createdAt: data.user.created_at
      };
    }
    return null;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.user_metadata?.name || 'User',
        role: profile?.role || user.user_metadata?.role || 'user',
        password: '',
        createdAt: user.created_at
      };
    }
    return null;
  },

  registerUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    // WARNING: This signs in the new user immediately in the browser context!
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          role: user.role
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      return {
        ...user,
        id: data.user.id,
        createdAt: data.user.created_at,
        password: ''
      };
    }
    throw new Error('Falha ao registrar usuário.');
  },

  deleteUser: async (id: string) => {
    // Note: This only deletes the profile. Auth user requires Admin API.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updatePassword: async (id: string, newPassword: string) => {
    // Note: Only works for currently logged in user
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },

  resetSystem: async () => {
    await supabase.auth.signOut();
    window.location.reload();
  }
};
