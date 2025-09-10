import Home from "../../pages/Home";
import { VendorService } from "../../services/vendorService";
import { ViewService } from "../../services/viewService";
import { RatingService } from "../../services/ratingService";

export const revalidate = 120; // Revalidate every 120 seconds

export default async function HomePage() {
  const initialVendors = await VendorService.getVendorsLite();
  
  // Fetch view counts and ratings for all vendors in parallel
  const vendorDataPromises = initialVendors.map(async (vendor) => {
    const viewCount = await ViewService.getViewCount(vendor.id);
    const ratingStats = await RatingService.getVendorRatingStats(vendor.id);
    return {
      ...vendor,
      viewCount: viewCount || 0,
      average_rating: ratingStats?.average_rating || 0,
      total_ratings: ratingStats?.total_ratings || 0,
    };
  });
  
  const vendorsWithStats = await Promise.all(vendorDataPromises);

  return <Home initialVendors={vendorsWithStats as any} />;
}
