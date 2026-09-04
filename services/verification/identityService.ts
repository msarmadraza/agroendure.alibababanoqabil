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
    }).eq('id', userId);
  } catch (err) {
    console.warn('DB identity update fallback warning:', err);
  }

  return { success: true };
}
