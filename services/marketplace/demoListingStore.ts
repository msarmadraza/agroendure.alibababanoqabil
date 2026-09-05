import { Listing } from '@/types/database';

const STORAGE_KEY_LISTINGS = 'agroendure_created_listings_v5';

// Memory cache for created listings (works on native too, where localStorage is absent)
let memoryCreatedListings: Listing[] = [];

// One-time cleanup of old test listings (specifically the Basmati Rice test listings with CNIC images)
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('agroendure_created_listings');
    window.localStorage.removeItem('agroendure_created_listings_v2');
    window.localStorage.removeItem('agroendure_created_listings_v3');
    window.localStorage.removeItem('agroendure_created_listings_v4');
  } catch {
    // ignore
  }
}

export function getCreatedListings(): Listing[] {
  if (memoryCreatedListings.length > 0) {
    return memoryCreatedListings;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_LISTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any stale listings with old test data
          const filtered = parsed.filter(
            (l: Listing) =>
              l.title !== 'Basmati Rice — 400 Mann' &&
              !l.title.includes('400 Mann') &&
              !l.title.includes('70 — Mann')
          );
          memoryCreatedListings = filtered;
          return filtered;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored listings:', e);
    }
  }

  return [];
}

export function addCreatedListing(listing: Listing) {
  const current = getCreatedListings();
  const updated = [listing, ...current.filter((l) => l.id !== listing.id)];
  memoryCreatedListings = updated;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save listing to storage:', e);
    }
  }
}

export function clearCreatedListings() {
  memoryCreatedListings = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_LISTINGS);
      window.localStorage.removeItem('agroendure_created_listings');
      window.localStorage.removeItem('agroendure_created_listings_v2');
      window.localStorage.removeItem('agroendure_created_listings_v3');
      window.localStorage.removeItem('agroendure_created_listings_v4');
    } catch (e) {
      console.warn('Failed to clear stored listings:', e);
    }
  }
}
