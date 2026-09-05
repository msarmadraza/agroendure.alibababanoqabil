import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase/client';
import { Profile } from '@/types/database';

// Two demo profiles for testing / hackathon demo mode
const DEMO_SELLER: Profile = {
  id: 'demo-seller-uuid',
  full_name: 'چوہدری احمد',
  phone: '+92 300 5551234',
  role: 'seller',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  identity_verified: true,
  identity_verification_status: 'verified',
};

const DEMO_BUYER: Profile = {
  id: 'demo-buyer-uuid',
  full_name: 'بلال خان',
  phone: '+92 321 8889900',
  role: 'buyer',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  identity_verified: false,
  identity_verification_status: 'not_started',
};

interface DemoAuthContextType {
  activeUser: Profile | null;
  activeRole: 'buyer' | 'seller';
  isDemo: boolean;
  isDemoSeller: boolean;
  toggleRole: () => void;
  setUserRole: (role: 'buyer' | 'seller') => void;
  realUser: any | null;
  realProfile: Profile | null;
  loading: boolean;
  setRealProfile: (profile: Profile | null) => void;
  loginWithProfile: (profile: Profile) => void;
}

const DemoAuthContext = createContext<DemoAuthContextType>({
  activeUser: null,
  activeRole: 'buyer',
  isDemo: true,
  isDemoSeller: false,
  toggleRole: () => {},
  setUserRole: () => {},
  realUser: null,
  realProfile: null,
  loading: true,
  setRealProfile: () => {},
  loginWithProfile: () => {},
});

const ACTIVE_PROFILE_KEY = 'agroendure_active_profile';

function loadStoredProfile(): Profile | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [isDemoSeller, setIsDemoSeller] = useState(false);
  const [realUser, setRealUser] = useState<any | null>(null);
  const [realProfile, setRealProfile] = useState<Profile | null>(loadStoredProfile);
  const [loading, setLoading] = useState(true);

  const loginWithProfile = (profile: Profile) => {
    setRealProfile(profile);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
      } catch {}
    }
  };

  useEffect(() => {
    // Check for real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setRealUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        const stored = loadStoredProfile();
        if (stored) {
          setRealProfile(stored);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setRealUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        const stored = loadStoredProfile();
        if (stored) {
          setRealProfile(stored);
        } else {
          setRealProfile(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setRealProfile(data);
        loginWithProfile(data);
      }
    } catch {
      // keep stored profile if any
    } finally {
      setLoading(false);
    }
  }

  const activeUser = realProfile
    ? realProfile
    : isDemoSeller
    ? DEMO_SELLER
    : DEMO_BUYER;

  const activeRole = activeUser?.role ?? 'buyer';
  const isDemo = !realProfile;

  const toggleRole = () => {
    if (!realProfile) {
      setIsDemoSeller((prev) => !prev);
    } else {
      const newRole: 'buyer' | 'seller' = realProfile.role === 'seller' ? 'buyer' : 'seller';
      setUserRole(newRole);
    }
  };

  const setUserRole = (role: 'buyer' | 'seller') => {
    if (!realProfile) {
      setIsDemoSeller(role === 'seller');
    } else {
      const updated = { ...realProfile, role };
      loginWithProfile(updated);
      supabase.from('profiles').update({ role }).eq('id', realProfile.id).then();
    }
  };

  return (
    <DemoAuthContext.Provider
      value={{
        activeUser,
        activeRole,
        isDemo,
        isDemoSeller,
        toggleRole,
        setUserRole,
        realUser,
        realProfile,
        loading,
        setRealProfile,
        loginWithProfile,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  return useContext(DemoAuthContext);
}

export { DEMO_SELLER, DEMO_BUYER };
