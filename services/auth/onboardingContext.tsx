import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/services/supabase/client';
import { UserRole } from '@/types/database';

export interface OnboardingData {
  role: UserRole | null;
  preferredLanguage: string;
  cnicHolderName: string | null;
  cnicNumber: string | null;
  facePhotoUri: string | null;
  phoneNumber: string | null;
}

interface OnboardingContextType {
  data: OnboardingData;
  setRole: (role: UserRole) => void;
  setLanguage: (lang: string) => void;
  setCnicData: (name: string, cnic: string) => void;
  setFacePhoto: (uri: string) => void;
  setPhone: (phone: string) => void;
  completeOnboarding: (userId: string) => Promise<boolean>;
  reset: () => void;
}

const defaultData: OnboardingData = {
  role: null,
  preferredLanguage: 'ur',
  cnicHolderName: null,
  cnicNumber: null,
  facePhotoUri: null,
  phoneNumber: null,
};

const STORAGE_KEY = 'agroendure_onboarding';

function loadFromStorage(): OnboardingData {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultData, ...JSON.parse(raw) };
    } catch {}
  }
  return defaultData;
}

function saveToStorage(data: OnboardingData) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
}

const OnboardingContext = createContext<OnboardingContextType>({
  data: defaultData,
  setRole: () => {},
  setLanguage: () => {},
  setCnicData: () => {},
  setFacePhoto: () => {},
  setPhone: () => {},
  completeOnboarding: async () => false,
  reset: () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(loadFromStorage);

  const update = (patch: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(next);
      return next;
    });
  };

  const setRole = (role: UserRole) => update({ role });
  const setLanguage = (preferredLanguage: string) => update({ preferredLanguage });
  const setCnicData = (cnicHolderName: string, cnicNumber: string) =>
    update({ cnicHolderName, cnicNumber });
  const setFacePhoto = (facePhotoUri: string) => update({ facePhotoUri });
  const setPhone = (phoneNumber: string) => update({ phoneNumber });

  const completeOnboarding = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('profiles').update({
        role: data.role,
        preferred_language: data.preferredLanguage,
        cnic_holder_name: data.cnicHolderName,
        cnic_number: data.cnicNumber,
        phone: data.phoneNumber,
        phone_verified: true,
        identity_verified: true,
        identity_verification_status: 'verified',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', userId);

      if (error) {
        console.warn('Onboarding profile update warning:', error);
      }

      return true;
    } catch (err) {
      console.warn('Onboarding completion error:', err);
      return true;
    }
  };

  const reset = () => {
    setData(defaultData);
    saveToStorage(defaultData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        setRole,
        setLanguage,
        setCnicData,
        setFacePhoto,
        setPhone,
        completeOnboarding,
        reset,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
