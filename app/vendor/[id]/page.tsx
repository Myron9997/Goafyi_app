import VendorProfile from "../../../pages/VendorProfile";
import { VendorService } from "../../../services/vendorService";
import { ViewService } from "../../../services/viewService";
import { RatingService } from "../../../services/ratingService";
import { notFound } from "next/navigation";

export const revalidate = 30; // Revalidate every 30 seconds (faster updates)

// Enable static generation for better performance
export async function generateStaticParams() {
  // This will be populated at build time for better performance
  return [];
}

// Add cache tags for this vendor
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    other: {
      'cache-tags': `vendor-${id},vendor-profile,vendors`
    }
  }
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // Fetch vendor data on the server
    const vendorData = await VendorService.getVendorByIdCachedFirst(id);
    
    if (!vendorData) {
      notFound();
    }
    
    // Fetch additional data in parallel
    const [viewCount, ratingStats, ratings] = await Promise.all([
      ViewService.getViewCount(id),
      RatingService.getVendorRatingStats(id),
      RatingService.getVendorRatings(id, 1, 10) // Get first 10 ratings
    ]);
    
    const vendorWithStats = {
      ...vendorData,
      viewCount: viewCount || 0,
      ratingStats: ratingStats || { average_rating: 0, total_ratings: 0 },
      recentRatings: ratings?.ratings || []
    };

    return <VendorProfile initialVendor={vendorWithStats as any} />;
  } catch (error) {
    console.error('Error loading vendor profile:', error);
    notFound();
  }
}
