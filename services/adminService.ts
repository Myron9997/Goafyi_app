import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Vendor = Database['public']['Tables']['vendors']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type BookingRequest = Database['public']['Tables']['booking_requests']['Row']

export interface AdminUser extends User {
  vendor?: Vendor
  bookings_count?: number
  last_activity?: string
  userType?: 'vendor' | 'viewer'
  name?: string
  avatar?: string
  category?: string
  verified?: boolean
  views?: number
  inquiries?: number
  packages?: any[]
  availability?: any[]
  bookings?: any[]
  notes?: string
  submittedAt?: string
  lastActive?: string
  status?: string
  suspended?: boolean
  instagram?: string
  website?: string
}

export interface AdminVendor extends Vendor {
  user: {
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    email: string
  }
  bookings_count?: number
  total_revenue?: number
}

export interface AdminAnalytics {
  totalUsers: number
  totalVendors: number
  totalViewers: number
  pendingVerifications: number
  totalBookings: number
  totalRevenue: number
  revenue: number
  userGrowth: Array<{ month: string; users: number }>
  bookingTrends: Array<{ month: string; bookings: number }>
  popularCategories: Array<{ name: string; count: number; revenue: number }>
  serviceTypeStats: Array<{
    service: string
    vendors: number
    viewers: number
    avgRating: number
    totalViews: number
  }>
  dailyActiveUsers: {
    vendors: number
    viewers: number
    total: number
  }
  topViewers: {
    daily: Array<{ name: string; views: number; lastActive: string; category: string }>
    monthly: Array<{ name: string; views: number; lastActive: string; category: string }>
    yearly: Array<{ name: string; views: number; lastActive: string; category: string }>
  }
  vendorRatings: Array<{
    name: string
    category: string
    rating: number
    reviews: number
    views: number
  }>
  serviceFilters: Array<{ service: string; count: number }>
  bookings: Array<{
    id: string
    viewerName: string
    viewerEmail: string
    vendorName: string
    vendorCategory: string
    eventDate: string
    eventType: string
    guestCount: number | null
    budget: number | null
    status: string
    notes: string | null
    createdAt: string
    updatedAt: string
  }>
}

export class AdminService {
  // Check if current user is admin
  static async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('AdminService.isAdmin - Auth user:', user)
    if (!user) return false

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('AdminService.isAdmin - Profile:', profile)
    console.log('AdminService.isAdmin - Role check:', profile?.role === 'admin')
    return profile?.role === 'admin'
  }

  // Get all users (viewers and vendors)
  static async getAllUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        vendor:vendors(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get booking counts for each user
    const usersWithBookings = await Promise.all(
      data.map(async (user) => {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        return {
          ...user,
          bookings_count: count || 0,
          last_activity: user.updated_at
        }
      })
    )

    return usersWithBookings
  }

  // Get all vendors with user details
  static async getAllVendors(): Promise<AdminVendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        user:users!vendors_user_id_fkey(full_name, avatar_url, phone, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get booking counts and revenue for each vendor
    const vendorsWithStats = await Promise.all(
      data.map(async (vendor) => {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)

        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_amount')
          .eq('vendor_id', vendor.id)
          .eq('status', 'completed')

        const totalRevenue = bookings?.reduce((sum, booking) => 
          sum + (booking.total_amount || 0), 0) || 0

        return {
          ...vendor,
          bookings_count: count || 0,
          total_revenue: totalRevenue
        }
      })
    )

    return vendorsWithStats
  }


  // Get all booking requests
  static async getAllBookingRequests(): Promise<BookingRequest[]> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        vendor:vendors!booking_requests_vendor_id_fkey(
          business_name,
          category,
          user:users!vendors_user_id_fkey(full_name, phone)
        ),
        user:users!booking_requests_user_id_fkey(full_name, email, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any
  }

  // Verify a vendor
  static async verifyVendor(vendorId: string): Promise<void> {
    const { error } = await supabase
      .from('vendors')
      .update({ is_verified: true })
      .eq('id', vendorId)

    if (error) throw error
  }

  // Reject a vendor
  static async rejectVendor(vendorId: string, reason?: string): Promise<void> {
    // You might want to add a rejection_reason field to vendors table
    const { error } = await supabase
      .from('vendors')
      .update({ is_verified: false })
      .eq('id', vendorId)

    if (error) throw error
  }

  // Suspend a user
  static async suspendUser(userId: string): Promise<void> {
    // You might want to add a suspended field to users table
    const { error } = await supabase
      .from('users')
      .update({ role: 'suspended' as any })
      .eq('id', userId)

    if (error) throw error
  }

  // Activate a user
  static async activateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role: 'viewer' })
      .eq('id', userId)

    if (error) throw error
  }

  // Get comprehensive analytics
  static async getAnalytics(): Promise<AdminAnalytics> {
    // Get basic counts
    const [usersResult, vendorsResult, confirmedBookingsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'confirmed')
    ])

    const totalUsers = usersResult.count || 0
    const totalVendors = vendorsResult.count || 0
    const totalBookings = confirmedBookingsResult.count || 0

    // Get viewers count
    const { count: totalViewers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'viewer')

    // Get pending verifications
    const { count: pendingVerifications } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', false)

    // Get total revenue from confirmed booking requests
    const { data: confirmedBookings } = await supabase
      .from('booking_requests')
      .select('counter_offer_price')
      .eq('status', 'confirmed')
      .not('counter_offer_price', 'is', null)

    const totalRevenue = confirmedBookings?.reduce((sum, booking) => 
      sum + (booking.counter_offer_price || 0), 0) || 0
    const revenue = totalRevenue

    // Get user growth (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: userGrowthData } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())

    const userGrowth = this.calculateMonthlyGrowth(userGrowthData || [])

    // Get booking trends (last 6 months)
    const { data: bookingTrendsData } = await supabase
      .from('booking_requests')
      .select('created_at')
      .eq('status', 'confirmed')
      .gte('created_at', sixMonthsAgo.toISOString())

    const bookingTrends = this.calculateMonthlyGrowth(bookingTrendsData || []).map(item => ({
      month: item.month,
      bookings: item.users
    }))

    // Get popular categories
    const { data: categoryData } = await supabase
      .from('vendors')
      .select('category')

    const popularCategories = this.calculatePopularCategories(categoryData || [])

    // Get service type stats
    const serviceTypeStats = await this.getServiceTypeStats()

    // Get daily active users (mock data for now - you'd need activity tracking)
    const dailyActiveUsers = {
      vendors: Math.floor(totalVendors * 0.3), // 30% of vendors active daily
      viewers: Math.floor((totalViewers || 0) * 0.2), // 20% of viewers active daily
      total: 0
    }
    dailyActiveUsers.total = dailyActiveUsers.vendors + dailyActiveUsers.viewers

    // Get top viewers (mock data for now - you'd need view tracking)
    const topViewers = await this.getTopViewers()

    // Get vendor ratings
    const vendorRatings = await this.getVendorRatings()

    // Get service filters
    const serviceFilters = await this.getServiceFilters()

    // Get all bookings
    const bookings = await this.getAllBookings()

    return {
      totalUsers,
      totalVendors,
      totalViewers: totalViewers ?? 0,
      pendingVerifications: pendingVerifications || 0,
      totalBookings,
      totalRevenue,
      revenue,
      userGrowth,
      bookingTrends,
      popularCategories,
      serviceTypeStats,
      dailyActiveUsers,
      topViewers,
      vendorRatings,
      serviceFilters,
      bookings
    }
  }

  // Helper methods
  private static calculateMonthlyGrowth(data: any[]): Array<{ month: string; users: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const result = []

    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12
      const monthName = months[targetMonth]
      
      const count = data.filter(item => {
        const date = new Date(item.created_at)
        return date.getMonth() === targetMonth
      }).length

      result.push({ month: monthName, users: count })
    }

    return result
  }

  private static calculatePopularCategories(categoryData: any[]): Array<{ name: string; count: number; revenue: number }> {
    const categoryCounts = categoryData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        count: count as number,
        revenue: (count as number) * 15000 // Mock revenue calculation
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }

  private static async getServiceTypeStats(): Promise<Array<{
    service: string
    vendors: number
    viewers: number
    avgRating: number
    totalViews: number
  }>> {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('category, rating, review_count')

    const { data: users } = await supabase
      .from('users')
      .select('role')

    const categories = [...new Set(vendors?.map(v => v.category) || [])]
    
    return categories.map(category => {
      const categoryVendors = vendors?.filter(v => v.category === category) || []
      const avgRating = categoryVendors.reduce((sum, v) => sum + (v.rating || 0), 0) / categoryVendors.length || 0
      const totalViews = categoryVendors.reduce((sum, v) => sum + (v.review_count || 0), 0)
      
      return {
        service: category,
        vendors: categoryVendors.length,
        viewers: Math.floor(Math.random() * 50) + 10, // Mock data
        avgRating: Math.round(avgRating * 10) / 10,
        totalViews
      }
    })
  }

  private static async getTopViewers(): Promise<{
    daily: Array<{ name: string; views: number; lastActive: string; category: string }>
    monthly: Array<{ name: string; views: number; lastActive: string; category: string }>
    yearly: Array<{ name: string; views: number; lastActive: string; category: string }>
  }> {
    // Get actual vendor data from database
    const { data: vendors } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        category,
        created_at,
        user:users!inner(full_name, last_sign_in_at)
      `)
      .limit(20)

    if (!vendors || vendors.length === 0) {
      return {
        daily: [],
        monthly: [],
        yearly: []
      }
    }

    // Get view counts from vendor_views table for each vendor
    const vendorViews = await Promise.all(
      vendors.map(async (vendor) => {
        // Get total views from vendor_views table
        const { data: views, error: viewsError } = await supabase
          .from('vendor_views')
          .select('id')
          .eq('vendor_id', vendor.id)

        if (viewsError) {
          console.error(`Error fetching views for vendor ${vendor.id}:`, viewsError)
        }

        const totalViews = views?.length || 0

        return {
          name: vendor.business_name || (vendor.user as any)?.full_name || 'Unknown Vendor',
          category: vendor.category || 'Uncategorized',
          views: totalViews,
          lastActive: (vendor.user as any)?.last_sign_in_at ? 
            new Date((vendor.user as any).last_sign_in_at).toISOString().split('T')[0] : 
            new Date(vendor.created_at).toISOString().split('T')[0]
        }
      })
    )

    // Sort by views and take top 5
    const sortedVendors = vendorViews
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    return {
      daily: sortedVendors,
      monthly: sortedVendors.map(v => ({ ...v, views: v.views * 2 })),
      yearly: sortedVendors.map(v => ({ ...v, views: v.views * 5 }))
    }
  }

  private static async getVendorRatings(): Promise<Array<{
    name: string
    category: string
    rating: number
    reviews: number
    views: number
  }>> {
    try {
      console.log('AdminService: Fetching vendor ratings from vendor_ratings and vendor_views tables...')
      
      // Get vendors with their basic info
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          category,
          user:users!vendors_user_id_fkey(full_name)
        `)
        .limit(20)

      if (vendorsError) {
        console.error('Error fetching vendors:', vendorsError)
        return []
      }

      console.log('AdminService: Found vendors:', vendors?.length || 0)

      if (!vendors || vendors.length === 0) {
        return []
      }

      // Get rating and view stats for each vendor
      const vendorRatings = await Promise.all(
        vendors.map(async (vendor) => {
          // Get ratings from vendor_ratings table
          const { data: ratings, error: ratingsError } = await supabase
            .from('vendor_ratings')
            .select('rating, review_text')
            .eq('vendor_id', vendor.id)

          if (ratingsError) {
            console.error(`Error fetching ratings for vendor ${vendor.id}:`, ratingsError)
          }

          // Get views from vendor_views table
          const { data: views, error: viewsError } = await supabase
            .from('vendor_views')
            .select('id')
            .eq('vendor_id', vendor.id)

          if (viewsError) {
            console.error(`Error fetching views for vendor ${vendor.id}:`, viewsError)
          }

          const totalRatings = ratings?.length || 0
          const totalViews = views?.length || 0
          const reviewsWithText = ratings?.filter(r => r.review_text && r.review_text.trim() !== '').length || 0
          
          // Calculate average rating
          const averageRating = totalRatings > 0 
            ? ratings!.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0

          return {
            name: vendor.business_name || (vendor.user as any)?.full_name || 'Unknown Vendor',
            category: vendor.category || 'Uncategorized',
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviews: reviewsWithText, // Count of reviews with actual text
            views: totalViews // Count of views from vendor_views table
          }
        })
      )

      // Filter out vendors with no ratings and sort by rating
      const filteredRatings = vendorRatings
        .filter(v => v.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      console.log('AdminService: Processed vendor ratings:', filteredRatings.length)
      return filteredRatings
    } catch (error) {
      console.error('AdminService: Error in getVendorRatings:', error)
      return []
    }
  }

  private static async getServiceFilters(): Promise<Array<{ service: string; count: number }>> {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('category')

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const categoryCounts = vendors?.reduce((acc, vendor) => {
      acc[vendor.category] = (acc[vendor.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const filters = [
      { service: "All Services", count: totalUsers || 0 },
      ...Object.entries(categoryCounts).map(([service, count]) => ({
        service,
        count
      }))
    ]

    return filters
  }

  // Get all confirmed booking requests as bookings for admin panel
  static async getAllBookings(): Promise<Array<{
    id: string
    viewerName: string
    viewerEmail: string
    vendorName: string
    vendorCategory: string
    eventDate: string
    eventType: string
    guestCount: number | null
    budget: number | null
    status: string
    notes: string | null
    createdAt: string
    updatedAt: string
  }>> {
    try {
      console.log('AdminService: Fetching confirmed booking requests...')
      
      const { data: bookingRequests, error } = await supabase
        .from('booking_requests')
        .select(`
          id,
          user_id,
          vendor_id,
          status,
          notes,
          created_at,
          updated_at,
          user:users!booking_requests_user_id_fkey(full_name, email),
          vendor:vendors!booking_requests_vendor_id_fkey(business_name, category)
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching confirmed booking requests:', error)
        return []
      }

      console.log('AdminService: Found confirmed booking requests:', bookingRequests?.length || 0)

      // Get event dates for each booking request
      const bookingsWithDates = await Promise.all(
        (bookingRequests || []).map(async (request) => {
          // Get the event dates for this booking request
          const { data: dates, error: datesError } = await supabase
            .from('booking_request_dates')
            .select('event_date')
            .eq('request_id', request.id)
            .order('event_date', { ascending: true })

          if (datesError) {
            console.error(`Error fetching dates for booking request ${request.id}:`, datesError)
          }

          // Use the first event date, or current date if none found
          const eventDate = dates && dates.length > 0 ? dates[0].event_date : new Date().toISOString().split('T')[0]

          return {
            id: request.id,
            viewerName: (request.user as any)?.full_name || 'Unknown User',
            viewerEmail: (request.user as any)?.email || 'No email',
            vendorName: (request.vendor as any)?.business_name || 'Unknown Vendor',
            vendorCategory: (request.vendor as any)?.category || 'Uncategorized',
            eventDate: eventDate,
            eventType: 'Wedding Service', // Default event type since it's not in booking_requests
            guestCount: null, // Not available in booking_requests
            budget: null, // Not available in booking_requests
            status: request.status,
            notes: request.notes,
            createdAt: request.created_at,
            updatedAt: request.updated_at
          }
        })
      )

      return bookingsWithDates
    } catch (error) {
      console.error('AdminService: Error in getAllBookings:', error)
      return []
    }
  }
}
