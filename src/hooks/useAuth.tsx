import { useState, useEffect, useContext, useCallback } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/auth';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthService } from '../services/auth';

/**
 * Custom hook to access the auth context
 * @returns AuthContextType with user and auth methods
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider component that manages authentication state and provides auth methods
 * to child components via context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Failed to load user session');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Log in a user with email and password
   * @param credentials Login credentials (email and password)
   */
  const login = useCallback<AuthContextType['login']>(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await AuthService.login(credentials);
      setUser(user);
      localStorage.setItem('gamedin-session', user.id);
      showToast('Logged in successfully!');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      showToast(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Register a new user
   * @param data User registration data
   */
  const register = useCallback<AuthContextType['register']>(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await AuthService.register(data);
      setUser(user);
      showToast('Registration successful! Welcome!');
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      showToast(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Log out the current user
   */
  const logout = useCallback<AuthContextType['logout']>(async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      localStorage.removeItem('gamedin-session');
      showToast('Logged out successfully');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      showToast(error.message || 'Failed to log out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update user profile
   * @param updates Partial user data with updates
   */
  const updateProfile = useCallback<AuthContextType['updateProfile']>(async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updatedUser = await AuthService.updateProfile(updates);
      setUser(updatedUser);
      showToast('Profile updated successfully');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      showToast(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  /**
   * Request a password reset email
   * @param email User's email address
   */
  const requestPasswordReset = useCallback<AuthContextType['requestPasswordReset']>(async (email: string) => {
    try {
      setIsLoading(true);
      await AuthService.requestPasswordReset(email);
      showToast('Password reset email sent. Please check your inbox.');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      showToast(error.message || 'Failed to send password reset email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Reset password with a reset token
   * @param token Password reset token
   * @param newPassword New password
   */
  const resetPassword = useCallback<AuthContextType['resetPassword']>(async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await AuthService.resetPassword(token, newPassword);
      showToast('Password reset successful. You can now log in with your new password.');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      showToast(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
