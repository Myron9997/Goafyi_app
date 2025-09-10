'use server';

import { revalidateTag } from 'next/cache';

// Revalidate specific vendor cache
export async function revalidateVendorCache(vendorId: string) {
  try {
    await revalidateTag(`vendor-${vendorId}`);
    await revalidateTag('vendor-profile');
    await revalidateTag('vendors');
    console.log(`Cache revalidated for vendor: ${vendorId}`);
  } catch (error) {
    console.error('Error revalidating vendor cache:', error);
  }
}

// Revalidate all vendor-related caches
export async function revalidateAllVendorCaches() {
  try {
    await revalidateTag('vendors');
    await revalidateTag('vendor-profile');
    console.log('All vendor caches revalidated');
  } catch (error) {
    console.error('Error revalidating all vendor caches:', error);
  }
}
