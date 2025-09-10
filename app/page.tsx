import Landing from "../pages/Landing";
import { supabase } from "../lib/supabase";

export const revalidate = 120;

export default async function Home() {
  // Server-side fetch of lightweight vendor list (ISR cached)
  const { data, error } = await supabase
    .from('vendors')
    .select('id,user_id,business_name,category,portfolio_images,social_media,website,contact_phone');

  const initialVendors = error ? [] : (data as any[]);

  return <Landing initialVendors={initialVendors as any} />;
}