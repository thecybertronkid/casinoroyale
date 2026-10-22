import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { UserProfile, UserRestrictions } from '../types/auth';

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loginWithGoogleCredential: (credential: string) => boolean;
  loginDemoUser: (name?: string, email?: string) => void;
  updateUserRestrictions: (restrictions: Partial<UserRestrictions>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '1064045036857-73ci5i2glr4bil4rqg3a5lfcljreqmrg.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pb_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('pb_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pb_active_user');
    }
  }, [user]);

  const getStoredRestrictions = (id: string): UserRestrictions => {
    const saved = localStorage.getItem(`pb_u_${id}_restrictions`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      isBanned: false,
      canClaimRelief: true,
      restrictedGames: [],
      maxBetLimit: null,
      adminNotes: '',
    };
  };

  const loginWithGoogleCredential = (credential: string): boolean => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      if (!decoded || !decoded.sub) return false;

      const restrictions = getStoredRestrictions(decoded.sub);

      const profile: UserProfile = {
        id: decoded.sub,
        email: decoded.email || 'user@gmail.com',
        name: decoded.name || 'Member',
        picture: decoded.picture || '',
        joinedAt: Date.now(),
        lastSeenAt: Date.now(),
        ...restrictions,
      };

      setUser(profile);
      return true;
    } catch (err) {
      console.error('Failed to decode Google JWT credential', err);
      return false;
    }
  };

  const loginDemoUser = (name = 'High Roller', email = 'member@poisaborbaad.vip') => {
    const id = 'demo_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
    const restrictions = getStoredRestrictions(id);

    const profile: UserProfile = {
      id,
      email,
      name,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      ...restrictions,
    };
    setUser(profile);
  };

  const updateUserRestrictions = (restrictions: Partial<UserRestrictions>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...restrictions };
      localStorage.setItem(`pb_u_${prev.id}_restrictions`, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginWithGoogleCredential,
        loginDemoUser,
        updateUserRestrictions,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
