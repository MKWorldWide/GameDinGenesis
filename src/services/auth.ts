import { api } from '../lib/api';
import { User, LoginCredentials, RegisterData } from '../types/auth';

const AUTH_TOKEN_KEY = 'gamedin-token';

export class AuthService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const { user, token } = await api.post<{ user: User; token: string }>(
        '/auth/login',
        credentials
      );
      this.setToken(token);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password');
    }
  }

  static async register(userData: RegisterData): Promise<User> {
    try {
      const { user, token } = await api.post<{ user: User; token: string }>(
        '/auth/register',
        userData
      );
      this.setToken(token);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.removeToken();
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      return await api.get<User>('/auth/me');
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      this.removeToken();
      return null;
    }
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    return api.patch<User>('/auth/me', updates);
  }

  static async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }
}
