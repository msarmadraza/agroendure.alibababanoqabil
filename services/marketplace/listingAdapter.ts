import { Listing } from '@/types/database';

// Urdu display names for supported quantity units
const UNIT_URDU: Record<string, string> = {
  Mann: 'من',
  KG: 'کلو',
  Ton: 'ٹن',
  Quintal: 'کوئنٹل',
  Bales: 'گٹھے',
};

// Bundled fallback images per crop family
const CROP_IMAGE_FALLBACKS: Array<{ keywords: string[]; image: number }> = [
  {
    keywords: ['گندم', 'wheat', 'gandum'],
    image: require('@/assets/wheat-field.jpg'),
  },
  {
    keywords: ['چاول', 'rice', 'chawal', 'basmati'],
    image: require('@/assets/rice-seedlings.jpg'),
  },
  {
    keywords: ['کپاس', 'cotton', 'kapas'],
    image: require('@/assets/cotton-harvest.jpg'),
  },
];

export interface CropCardView {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: string;
  location: string;
  timeAgo: string;
  image: any;
  farmerName: string;
  hasVoiceDescription: boolean;
  isAvailable: boolean;
}

/** Urdu "time ago" label from an ISO timestamp. */
export function timeAgoUrdu(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (minutes < 1) return 'ابھی ابھی';
  if (minutes < 60) return `${minutes} منٹ پہلے`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} گھنٹے پہلے`;
  const days = Math.floor(hours / 24);
  return `${days} دن پہلے`;
}

function fallbackImageFor(cropName: string): any {
  const lower = (cropName ?? '').toLowerCase();
  const match = CROP_IMAGE_FALLBACKS.find((f) =>
    f.keywords.some((k) => lower.includes(k.toLowerCase()))
  );
  return match ? match.image : require('@/assets/wheat-field.jpg');
}

/**
 * Converts a Listing (live Supabase row, locally created, or mock)
 * into the view shape used by the marketplace CropCard.
 */
export function listingToCropCard(listing: Listing): CropCardView {
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    currency: listing.currency || 'PKR',
    quantity: `${listing.quantity} ${UNIT_URDU[listing.quantity_unit] ?? listing.quantity_unit}`,
    location: 'پاکستان',
    timeAgo: timeAgoUrdu(listing.created_at),
    image: firstImage?.public_url
      ? { uri: firstImage.public_url }
      : fallbackImageFor(listing.product_name),
    farmerName: listing.seller?.full_name ?? 'کسان',
    // Listings published through the AI Voice Listing Wizard carry a mic badge
    hasVoiceDescription: listing.id.startsWith('listing-created-'),
    isAvailable: listing.status === 'active',
  };
}
