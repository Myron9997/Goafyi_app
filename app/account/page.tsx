import { redirect } from 'next/navigation';
import Account from "../../pages/Account";
import { createServerSupabaseClient } from '../../lib/supabase-server';
import { VendorService } from '../../services/vendorService';

export const revalidate = 120; // Revalidate every 120 seconds
export const dynamic = 'force-dynamic'; // Force dynamic rendering for authentication

export default async function AccountPage() {
  try {
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get the current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If no user or auth error, redirect to vendor login
    if (authError || !user) {
      redirect('/vendor-login');
    }
    
    // Fetch vendor data for the authenticated user
    const vendorData = await VendorService.getVendorByUserIdServer(supabase, user.id);
    
    // If no vendor profile exists, redirect to signup
    if (!vendorData) {
      redirect('/signup');
    }
    
    // Pass the initial vendor data to the client component
    return <Account initialVendor={vendorData} />;
    
  } catch (error) {
    // Handle NEXT_REDIRECT errors gracefully (these are expected)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect errors to let Next.js handle them
    }
    
    // For other errors, fall back to client-side rendering
    console.error('AccountPage SSR failed, falling back to client-side:', error);
    return <Account />;
  }
}
