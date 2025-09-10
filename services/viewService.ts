import { supabase } from '../lib/supabase';

export interface VendorView {
  id: string;
  vendor_id: string;
  viewer_id?: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
  created_at: string;
}

export interface ViewStats {
  total_views: number;
  unique_views: number;
  recent_views: number; // views in last 7 days
}

export class ViewService {
  /**
   * Track a view for a vendor profile
   * @param vendorId - The ID of the vendor being viewed
   * @param viewerId - The ID of the user viewing (optional for anonymous users)
   * @returns Promise<boolean> - Success status
   */
  static async trackView(vendorId: string, viewerId?: string): Promise<boolean> {
    try {
      // Get user's IP and user agent for anonymous tracking
      const userAgent = navigator.userAgent;
      
      // For now, we'll use a simple approach without IP tracking
      // In production, you might want to get IP from your backend
      const viewData: Partial<VendorView> = {
        vendor_id: vendorId,
        viewer_id: viewerId || null,
        user_agent: userAgent,
        viewed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vendor_views')
        .insert(viewData);

      if (error) {
        console.error('Error tracking view:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error tracking view:', error);
      return false;
    }
  }

  /**
   * Get view statistics for a vendor
   * @param vendorId - The ID of the vendor
   * @returns Promise<ViewStats | null>
   */
  static async getViewStats(vendorId: string): Promise<ViewStats | null> {
    try {
      // Get total views
      const { count: totalViews, error: totalError } = await supabase
        .from('vendor_views')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      if (totalError) {
        console.error('Error getting total views:', totalError);
        return null;
      }

      // Get unique views (distinct viewer_id or ip_address)
      const { data: uniqueViews, error: uniqueError } = await supabase
        .from('vendor_views')
        .select('viewer_id, ip_address')
        .eq('vendor_id', vendorId);

      if (uniqueError) {
        console.error('Error getting unique views:', uniqueError);
        return null;
      }

      // Calculate unique views
      const uniqueViewers = new Set();
      uniqueViews?.forEach(view => {
        const identifier = view.viewer_id || view.ip_address;
        if (identifier) {
          uniqueViewers.add(identifier);
        }
      });

      // Get recent views (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentViews, error: recentError } = await supabase
        .from('vendor_views')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .gte('viewed_at', sevenDaysAgo.toISOString());

      if (recentError) {
        console.error('Error getting recent views:', recentError);
        return null;
      }

      return {
        total_views: totalViews || 0,
        unique_views: uniqueViewers.size,
        recent_views: recentViews || 0
      };
    } catch (error) {
      console.error('Error getting view stats:', error);
      return null;
    }
  }

  /**
   * Get view count for a vendor (simple version)
   * @param vendorId - The ID of the vendor
   * @returns Promise<number>
   */
  static async getViewCount(vendorId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('vendor_views')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('Error getting view count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting view count:', error);
      return 0;
    }
  }

  /**
   * Check if a user has already viewed a vendor today
   * @param vendorId - The ID of the vendor
   * @param viewerId - The ID of the viewer
   * @returns Promise<boolean>
   */
  static async hasViewedToday(vendorId: string, viewerId?: string): Promise<boolean> {
    try {
      if (!viewerId) return false; // Can't track anonymous users for daily limit

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('vendor_views')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('viewer_id', viewerId)
        .gte('viewed_at', today.toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking today views:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking today views:', error);
      return false;
    }
  }

  /**
   * Track view with duplicate prevention (one view per user per day)
   * @param vendorId - The ID of the vendor being viewed
   * @param viewerId - The ID of the user viewing
   * @returns Promise<boolean> - Success status
   */
  static async trackViewWithDuplicatePrevention(vendorId: string, viewerId?: string): Promise<boolean> {
    try {
      // If user is logged in, check if they've already viewed today
      if (viewerId) {
        const hasViewed = await this.hasViewedToday(vendorId, viewerId);
        if (hasViewed) {
          console.log('User has already viewed this vendor today');
          return true; // Not an error, just already counted
        }
      }

      // Track the view
      return await this.trackView(vendorId, viewerId);
    } catch (error) {
      console.error('Error tracking view with duplicate prevention:', error);
      return false;
    }
  }
}
