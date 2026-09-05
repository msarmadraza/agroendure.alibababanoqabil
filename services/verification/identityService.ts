import { supabase } from '@/services/supabase/client';
import { IdentityVerificationRecord, ExtractionSource } from '@/types/identityVerification';

const STORAGE_KEY_IDENTITY = 'agroendure_identity_verifications';

// In-memory demo store
const memoryVerifications: Record<string, IdentityVerificationRecord> = {};

export async function fetchUserVerification(userId: string): Promise<IdentityVerificationRecord | null> {
  // Check memory store
  if (memoryVerifications[userId]) {
    return memoryVerifications[userId];
  }

  // Check localStorage for web demo persistence
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_KEY_IDENTITY}_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryVerifications[userId] = parsed;
        return parsed;
      }
    } catch {
      // Ignore
    }
  }

  // Fetch from Supabase DB
  try {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      memoryVerifications[userId] = data as IdentityVerificationRecord;
      return data as IdentityVerificationRecord;
    }
  } catch (err) {
    console.warn('DB identity fetch warning:', err);
  }

  return null;
}

export async function checkDuplicateCNIC(cnicNumber: string, currentUserId: string): Promise<boolean> {
  const normalized = cnicNumber.replace(/\D/g, '');
  if (!normalized) return false;

  // Check memory verifications
  for (const uid in memoryVerifications) {
    if (uid !== currentUserId) {
      const rec = memoryVerifications[uid];
      if (rec && rec.cnic_number && rec.cnic_number.replace(/\D/g, '') === normalized) {
        return true; // Duplicate found!
      }
    }
  }

  // Check Supabase DB
  try {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('user_id, cnic_number')
      .eq('cnic_number', cnicNumber)
      .neq('user_id', currentUserId);

    if (!error && data && data.length > 0) {
      return true;
    }
  } catch {
    // Ignore
  }

  return false;
}

export async function confirmUserIdentity(
  userId: string,
  holderName: string,
  cnicNumber: string,
  source: ExtractionSource = 'gemini_extracted'
): Promise<{ success: boolean; error?: string }> {
  // 1. Check for duplicate CNIC
  const isDuplicate = await checkDuplicateCNIC(cnicNumber, userId);
  if (isDuplicate) {
    return {
      success: false,
      error: 'This identity information is already associated with another account.',
    };
  }

  const record: IdentityVerificationRecord = {
    id: `verif-${Date.now()}`,
    user_id: userId,
    document_type: 'pakistani_cnic',
    holder_name: holderName,
    cnic_number: cnicNumber,
    verification_status: 'verified',
    extraction_source: source,
    confidence: source === 'gemini_extracted' ? 0.98 : 0.85,
    verification_attempts: 1,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Update memory & localStorage
  memoryVerifications[userId] = record;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${STORAGE_KEY_IDENTITY}_${userId}`, JSON.stringify(record));
    } catch {
      // Ignore
    }
  }

  // Save to Supabase DB & update profile
  try {
    await supabase.from('identity_verifications').upsert({
      user_id: userId,
      document_type: 'pakistani_cnic',
      holder_name: holderName,
      cnic_number: cnicNumber,
      verification_status: 'verified',
      extraction_source: source,
      confidence: record.confidence,
      verified_at: record.verified_at,
    });

    await supabase.from('profiles').update({
      identity_verified: true,
      identity_verification_status: 'verified',
      cnic_holder_name: holderName,
      cnic_number: cnicNumber,
    }).eq('id', userId);
  } catch (err) {
    console.warn('DB identity update fallback warning:', err);
  }

  return { success: true };
}

const STORAGE_KEY_PROFILES = 'agroendure_saved_profiles';

export async function findProfileByCNIC(cnicNumber: string): Promise<any | null> {
  const normalized = cnicNumber.replace(/\D/g, '');
  if (!normalized) return null;

  // 1. Check local storage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_PROFILES);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const found = list.find(
            (p: any) => p.cnic_number && p.cnic_number.replace(/\D/g, '') === normalized
          );
          if (found) return found;
        }
      }
    } catch {}
  }

  // 2. Query Supabase DB
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('cnic_number', cnicNumber)
      .maybeSingle();

    if (!error && data) {
      saveProfileLocally(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase findProfileByCNIC warning:', err);
  }

  return null;
}

export async function saveProfileLocally(profile: any): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_PROFILES);
      let list: any[] = [];
      if (raw) {
        try {
          list = JSON.parse(raw) || [];
        } catch {}
      }
      list = [profile, ...list.filter((p: any) => p.id !== profile.id && p.cnic_number !== profile.cnic_number)];
      window.localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(list));
      window.localStorage.setItem('agroendure_active_profile', JSON.stringify(profile));
    } catch {}
  }
}

export async function createOrUpdateProfileWithIdentity(profileData: {
  id?: string;
  role: 'buyer' | 'seller';
  cnicNumber: string;
  holderName: string;
  holderNameUrdu?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  preferredLanguage?: string;
}): Promise<any> {
  const existing = await findProfileByCNIC(profileData.cnicNumber);
  const userId = profileData.id || existing?.id || `user-${Date.now()}`;

  const profile: any = {
    id: userId,
    full_name: profileData.holderName,
    full_name_ur: profileData.holderNameUrdu || existing?.full_name_ur || null,
    cnic_holder_name: profileData.holderName,
    cnic_holder_name_ur: profileData.holderNameUrdu || existing?.cnic_holder_name_ur || null,
    cnic_number: profileData.cnicNumber,
    role: profileData.role || existing?.role || 'seller',
    phone: profileData.phone || existing?.phone || null,
    avatar_url: profileData.avatarUrl || existing?.avatar_url || null,
    preferred_language: profileData.preferredLanguage || existing?.preferred_language || 'ur',
    identity_verified: true,
    identity_verification_status: 'verified',
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save locally
  await saveProfileLocally(profile);

  // 2. Save to Supabase
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .maybeSingle();

    if (!error && data) {
      await saveProfileLocally(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase profile upsert fallback warning:', err);
  }

  return profile;
}

