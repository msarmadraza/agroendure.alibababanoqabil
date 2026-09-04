import { Listing } from '@/types/database';

const STORAGE_KEY_LISTINGS = 'agroendure_created_listings';

// Memory cache for created listings (works on native too, where localStorage is absent)
let memoryCreatedListings: Listing[] = [];

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
          memoryCreatedListings = parsed;
          return parsed;
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
    } catch (e) {
      console.warn('Failed to clear stored listings:', e);
    }
  }
}
