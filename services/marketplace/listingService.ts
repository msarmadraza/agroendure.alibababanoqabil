import { supabase } from '@/services/supabase/client';
import { Listing, ListingImage, Profile } from '@/types/database';
import { addCreatedListing, getCreatedListings } from '@/services/marketplace/demoListingStore';

// Pakistani crop mock data for demo mode (fallback when Supabase is unreachable)
export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing-001',
    seller_id: 'demo-seller-uuid',
    title: 'اعلی کوالٹی گندم',
    description: 'پنجاب کی بہترین گندم، تازہ فصل، گریڈ اے معیار',
    product_name: 'گندم',
    quantity: 500,
    quantity_unit: 'Mann',
    price: 85000,
    currency: 'PKR',
    status: 'active',
    quality: 'Grade A',
    quality_description: 'Premium quality wheat from Punjab',
    product_category: 'Grain',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'demo-seller-uuid',
      full_name: 'چوہدری احمد',
      phone: '+92 300 5551234',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity_verified: true,
    },
    images: [],
  },
  {
    id: 'listing-002',
    seller_id: 'demo-seller-uuid',
    title: 'تازہ چاول کے بیج',
    description: 'گجرانوالہ سے سپر باسمتی چاول، اعلی معیار',
    product_name: 'چاول',
    quantity: 25,
    quantity_unit: 'KG',
    price: 12000,
    currency: 'PKR',
    status: 'active',
    quality: 'Grade A',
    quality_description: 'Super Basmati from Gujranwala',
    product_category: 'Grain',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'seller-2',
      full_name: 'محمد حسن',
      phone: '+92 333 7778888',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity_verified: true,
    },
    images: [],
  },
  {
    id: 'listing-003',
    seller_id: 'seller-3',
    title: 'کپاس کی فصل',
    description: 'ملتان سے اعلی معیار کی کپاس',
    product_name: 'کپاس',
    quantity: 200,
    quantity_unit: 'Mann',
    price: 95000,
    currency: 'PKR',
    status: 'active',
    quality: 'Grade B',
    quality_description: 'Good quality cotton from Multan',
    product_category: 'Fiber',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'seller-3',
      full_name: 'علی رضا',
      phone: '+92 311 4445555',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity_verified: true,
    },
    images: [],
  },
  {
    id: 'listing-004',
    seller_id: 'seller-4',
    title: 'گنا — فیصل آباد',
    description: 'تازہ گنا، فصل ابھی کاٹی گئی',
    product_name: 'گنا',
    quantity: 1000,
    quantity_unit: 'Mann',
    price: 45000,
    currency: 'PKR',
    status: 'active',
    quality: 'Grade A',
    quality_description: 'Fresh sugarcane from Faisalabad',
    product_category: 'Cash Crop',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'seller-4',
      full_name: 'اقبال چوہدری',
      phone: '+92 345 6667777',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity_verified: true,
    },
    images: [],
  },
  {
    id: 'listing-005',
    seller_id: 'seller-5',
    title: 'مکئی — لاہور',
    description: 'اعلی معیار کی مکئی، گریڈ اے',
    product_name: 'مکئی',
    quantity: 300,
    quantity_unit: 'Mann',
    price: 55000,
    currency: 'PKR',
    status: 'active',
    quality: 'Grade A',
    quality_description: 'Premium corn, Grade A',
    product_category: 'Grain',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'seller-5',
      full_name: 'عمر فاروق',
      phone: '+92 322 9998887',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity_verified: false,
    },
    images: [],
  },
];

// Market prices mock data (PKR per Mann)
export const MARKET_PRICES = [
  { crop: 'گندم', cropEn: 'Wheat', keywords: ['گندم', 'wheat', 'gandum'], price: 8500, change: +2.5 },
  { crop: 'چاول', cropEn: 'Rice', keywords: ['چاول', 'rice', 'chawal', 'basmati'], price: 12000, change: -1.2 },
  { crop: 'کپاس', cropEn: 'Cotton', keywords: ['کپاس', 'cotton', 'kapas'], price: 9500, change: +5.8 },
  { crop: 'گنا', cropEn: 'Sugarcane', keywords: ['گنا', 'sugarcane', 'ganna'], price: 4500, change: +0.8 },
  { crop: 'مکئی', cropEn: 'Corn', keywords: ['مکئی', 'corn', 'makkai'], price: 5500, change: -0.5 },
];

/**
 * AI price suggestion: matches the detected crop against current market
 * prices and adjusts for the detected quality grade.
 */
export function suggestListingPrice(cropName: string | null, quality: string | null): number {
  const lower = (cropName ?? '').toLowerCase();
  const matched = MARKET_PRICES.find((m) =>
    m.keywords.some((k) => lower.includes(k.toLowerCase()))
  );
  const basePrice = matched ? matched.price : 6000;

  if (!quality) return basePrice;
  if (quality.includes('A')) return Math.round(basePrice * 1.1);
  if (quality.includes('C')) return Math.round(basePrice * 0.85);
  return basePrice;
}

/**
 * Fetch live listings from Supabase and merge with locally created listings
 * and demo mocks, so the marketplace feed always has content.
 */
export async function fetchListings(searchQuery?: string): Promise<Listing[]> {
  const createdListings = getCreatedListings();
  let dbListings: Listing[] = [];

  try {
    let query = supabase
      .from('listings')
      .select(
        `
        *,
        seller:profiles(*),
        images:listing_images(*)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.or(
        `title.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;
    if (!error && data) {
      dbListings = data as Listing[];
    }
  } catch (err) {
    console.warn('DB fetch error, using local fallback:', err);
  }

  // Merge createdListings + dbListings + MOCK_LISTINGS safely (no duplicates)
  const map = new Map<string, Listing>();
  createdListings.forEach((item) => map.set(item.id, item));
  dbListings.forEach((item) => map.set(item.id, item));
  MOCK_LISTINGS.forEach((item) => {
    if (!map.has(item.id)) map.set(item.id, item);
  });

  let allListings = Array.from(map.values());

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    allListings = allListings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.product_name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }

  return allListings;
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const createdListings = getCreatedListings();
  const foundLocal = createdListings.find((l) => l.id === id);
  if (foundLocal) return foundLocal;

  const foundMock = MOCK_LISTINGS.find((l) => l.id === id);
  if (foundMock) return foundMock;

  try {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        *,
        seller:profiles(*),
        images:listing_images(*)
      `
      )
      .eq('id', id)
      .single();

    if (!error && data) {
      return data as Listing;
    }
  } catch (err) {
    console.warn('DB fetch by id error:', err);
  }

  return null;
}

export interface CreateListingPayload {
  seller_id: string;
  title: string;
  description: string;
  product_name: string;
  quantity: number;
  quantity_unit: string;
  price: number;
  quality?: string;
  quality_description?: string;
  product_category?: string;
}

/**
 * Creates a listing. Primary path inserts a live row in Supabase
 * (requires an authenticated session + schema). When that fails
 * (demo mode / offline), the listing is stored locally so it still
 * appears instantly in the marketplace feed.
 */
export async function createListing(
  listingData: CreateListingPayload,
  seller?: Profile | null
): Promise<Listing> {
  let created: Listing | null = null;

  try {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        ...listingData,
        currency: 'PKR',
        status: 'active',
      })
      .select()
      .single();

    if (!error && data) {
      created = data as Listing;
    }
  } catch (err) {
    console.warn('DB insert error, saving listing locally:', err);
  }

  if (!created) {
    created = {
      ...listingData,
      currency: 'PKR',
      status: 'active',
      id: `listing-created-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seller:
        seller ?? {
          id: listingData.seller_id,
          full_name: 'ڈیمو کسان',
          phone: null,
          role: 'seller',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
    };
  }

  addCreatedListing(created);
  return created;
}

/**
 * Creates a listing and attaches photos:
 * 1. Inserts the listing row in Supabase (live).
 * 2. Uploads each photo to the `listing-images` storage bucket.
 * 3. Records each photo in the `listing_images` table.
 * Falls back to local storage URLs when the DB is unavailable.
 */
export async function createListingWithImages(
  listingData: CreateListingPayload,
  imageUris: string[],
  seller?: Profile | null
): Promise<Listing> {
  const listing = await createListing(listingData, seller);

  if (imageUris && imageUris.length > 0) {
    const imageRecords: Partial<ListingImage>[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      let publicUrl = uri;

      // Upload the photo to Supabase Storage (works for data URIs and http(s) URIs)
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `${listing.id}/${Date.now()}_${i + 1}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        }
      } catch (e) {
        console.warn('Image upload failed, keeping local URI:', e);
      }

      imageRecords.push({
        listing_id: listing.id,
        storage_path: `listing-images/${listing.id}/${i + 1}.jpg`,
        public_url: publicUrl,
        display_order: i + 1,
      });
    }

    // Persist image records in the DB (live); ignore failure in demo mode
    try {
      await supabase.from('listing_images').insert(imageRecords);
    } catch {
      // Ignore DB error for offline/demo mode
    }

    listing.images = imageRecords as ListingImage[];
    addCreatedListing(listing);
  }

  return listing;
}
