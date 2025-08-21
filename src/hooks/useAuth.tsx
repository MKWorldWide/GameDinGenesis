

import { useState, useEffect, useContext, useCallback } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/auth';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthService } from '../services/auth';

/**
 * Custom hook to access the auth context
 * @returns AuthContextType with user and auth methods
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
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
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await AuthService.login(credentials);
      setUser(user);
      showToast('Successfully logged in');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Login failed');
      showToast(error.message || 'Login failed', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Register a new user
   * @param data User registration data
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await AuthService.register(data);
      setUser(user);
      showToast('Registration successful! Welcome!');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Registration failed');
      showToast(error.message || 'Registration failed', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Log out the current user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      showToast('Successfully logged out');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Logout failed');
      showToast(error.message || 'Logout failed', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update the current user's profile
   * @param updates Partial user object with fields to update
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    try {
      setIsLoading(true);
      const updatedUser = await AuthService.updateProfile(updates);
      setUser(updatedUser);
      showToast('Profile updated successfully');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update profile');
      showToast(error.message || 'Failed to update profile', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  /**
   * Request a password reset email
   * @param email User's email address
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      await AuthService.requestPasswordReset(email);
      showToast('Password reset instructions sent to your email');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to request password reset');
      showToast(error.message || 'Failed to request password reset', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Reset password with a reset token
   * @param token Password reset token
   * @param newPassword New password to set
   */
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await AuthService.resetPassword(token, newPassword);
      showToast('Password reset successful. Please log in with your new password.');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to reset password');
      showToast(error.message || 'Failed to reset password', { variant: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Context value containing user state and auth methods
  const value = {
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
            localStorage.setItem('gamedin-session', existingUser.id);
            setUser(existingUser);
            showToast(`Welcome back, ${existingUser.name}`);
            return;
        }
    }
      
    const newUser: User = { 
      id: `user_${Date.now()}`,
      name: soulName,
      handle,
      dream,
      path,
      avatarUrl: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)],
      headerUrl: MOCK_HEADERS[Math.floor(Math.random() * MOCK_HEADERS.length)],
      bio: "A new soul, awakened. The dream begins.",
      pronouns: '',
      status: 'A new soul, awakened.',
      anthemUrl: '',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      settings: defaultSettings,
      following: ['oracle_ai'],
      linkedAccounts: [],
      nexusData: {},
      creatorProfile: defaultCreatorProfile,
      gallery: [],
      nexusFeed: [],
      factionId: undefined,
    };
    
    db.addUser(newUser);
    localStorage.setItem('gamedin-session', newUser.id);
    
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('gamedin-session');
    setUser(null);
  };
  
  const updateUser = useCallback((newUserDetails: Partial<User>) => {
    if (!user) return;
    const updatedUser = { 
        ...user, 
        ...newUserDetails, 
        settings: {...user.settings, ...newUserDetails.settings},
        nexusData: newUserDetails.nexusData ? {...user.nexusData, ...newUserDetails.nexusData} : user.nexusData,
        creatorProfile: newUserDetails.creatorProfile ? { ...user.creatorProfile, ...newUserDetails.creatorProfile, xp: {...user.creatorProfile.xp, ...newUserDetails.creatorProfile.xp}} : user.creatorProfile,
    };
    
    db.updateUser(updatedUser);
    setUser(updatedUser);
  }, [user]);

    const pledgeToFaction = useCallback((factionId: string) => {
        if (!user) return;
        updateUser({ factionId });
    }, [user, updateUser]);

  const updateCreatorXP = useCallback((xpGains: Partial<CreatorXP>) => {
    if (!user) return;
    const newXP: CreatorXP = { ...user.creatorProfile.xp };
    let totalXPGained = 0;
    (Object.keys(xpGains) as Array<keyof CreatorXP>).forEach(key => {
        newXP[key] = (newXP[key] || 0) + (xpGains[key] || 0);
        totalXPGained += xpGains[key] || 0;
    });

    // TODO: Add logic to update tier based on total XP
    const updatedProfile: CreatorProfile = {
        ...user.creatorProfile,
        xp: newXP,
    };

    updateUser({ creatorProfile: updatedProfile });
    if(totalXPGained > 0) {
      showToast(`Gained ${totalXPGained} Creator XP!`);
    }
  }, [user, updateUser, showToast]);

  const saveConceptToGallery = useCallback((concept: Omit<GeneratedConcept, 'id'>, questId?: string) => {
    if (!user) return;
    
    const newConcept: GeneratedConcept = {
        ...concept,
        id: `concept_${Date.now()}`,
        submittedToQuestId: questId,
    };
    const newGallery = [...user.gallery, newConcept];
    updateUser({ gallery: newGallery });

    if (questId) {
        const quest = db.getQuestById(questId);
        if (quest && quest.status === 'active') {
            quest.contributions.push({ conceptId: newConcept.id, userId: user.id });
            db.updateWorldQuest(quest);
            updateCreatorXP({ integration: 25, expression: 10 }); // Bonus XP for contributing
            showToast(`Contributed "${concept.name}" to the world quest!`);
        } else {
             showToast(`"${concept.name}" has been saved to your gallery!`);
        }
    } else {
        showToast(`"${concept.name}" has been saved to your gallery!`);
    }
  }, [user, updateUser, showToast, updateCreatorXP]);


  const toggleFollow = useCallback((handleToToggle: string) => {
    if (!user) return;
    const isFollowing = user.following.includes(handleToToggle);
    const newFollowing = isFollowing
        ? user.following.filter(f => f !== handleToToggle)
        : [...user.following, handleToToggle];
    
    updateUser({ following: newFollowing });
    showToast(isFollowing ? `Unfollowed @${handleToToggle}` : `Followed @${handleToToggle}`);
  }, [user, updateUser, showToast]);

  const refreshNexusData = useCallback(async () => {
    if (!user) return;
    try {
        showToast("Syncing with the Nexus...");
        const data = await nexus.fetchNexusData(user.linkedAccounts, user);
        
        // Replace data instead of merging for simplicity in this phase
        updateUser({ 
            nexusData: data,
            nexusFeed: [...(user.nexusFeed || []), ...(data.nexusFeed || [])]
        });
        showToast("Nexus data synchronized!");
    } catch(e) {
        console.error(`[Nexus] Failed to refresh data`, e);
        showToast("Failed to refresh Nexus data. The connection is unstable.");
    }
  }, [user, updateUser, showToast]);

  const linkNexusAccount = useCallback(async (provider: NetworkProvider) => {
    if (!user) return;
    try {
      showToast(`Connecting to ${provider}...`);
      const newAccount = await nexus.connectAccount(provider, user.name);
      const updatedAccounts = [...user.linkedAccounts, newAccount];
      
      const accountLinkFeedItem: NexusFeedItem = {
          id: `feed_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'AccountLink',
          text: `You connected your ${provider.charAt(0).toUpperCase() + provider.slice(1)} account.`,
          sourceProvider: provider
      };

      const userWithNewAccount = { ...user, linkedAccounts: updatedAccounts };
      updateUser({
        linkedAccounts: updatedAccounts,
        nexusFeed: [...user.nexusFeed, accountLinkFeedItem]
      });
      
      showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked! Syncing...`);
      await refreshNexusData();

    } catch (e) {
      console.error(`[Nexus] Failed to link ${provider}`, e);
      showToast(`Failed to link ${provider}. The Nexus may be experiencing interference.`);
    }
  }, [user, updateUser, showToast, refreshNexusData]);

  const unlinkNexusAccount = useCallback(async (provider: NetworkProvider) => {
    if(!user) return;
    
    const updatedAccounts = user.linkedAccounts.filter(acc => acc.provider !== provider);
    showToast(`Unlinking from ${provider}. Resyncing Nexus...`);

    // Create a new user object to clear data from the unlinked provider
    const clearedNexusData = {...user.nexusData};
    if (provider === 'steam') delete clearedNexusData.steam;
    if (provider === 'twitch') delete clearedNexusData.twitch;
    // Trophies and friends are regenerated based on remaining accounts
    
    updateUser({ 
        linkedAccounts: updatedAccounts,
        nexusData: clearedNexusData
    });
    
    // Refetch data based on remaining accounts
    await refreshNexusData();
    showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} unlinked. Nexus synchronized.`);

  }, [user, updateUser, showToast, refreshNexusData]);

  const value = { user, login, logout, loading, updateUser, showToast, toggleFollow, linkNexusAccount, unlinkNexusAccount, refreshNexusData, updateCreatorXP, saveConceptToGallery, pledgeToFaction };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
