'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import { AdminService } from '../../../services/adminService';
import { supabase } from '../../../lib/supabase';
import type { AdminUser, AdminVendor, AdminAnalytics } from '../../../services/adminService';

// AdminPanel.jsx
// Restructured Admin dashboard with unified navigation
// - Main tabs: Dashboard, Users, Analytics, Settings
// - Unified user management (viewers + vendors)
// - Comprehensive analytics with charts
// - Mobile-first design with bottom navigation

function AdminDashboardContent() {
  const router = useRouter();

  // ----- UI state -----
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'users' | 'analytics' | 'settings'
  const [userSubTab, setUserSubTab] = useState("all"); // 'all' | 'viewers' | 'vendors' | 'pending'
  const [analyticsSubTab, setAnalyticsSubTab] = useState("overview"); // 'overview' | 'users' | 'vendors' | 'bookings' | 'content'
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  // ----- Data (real backend) -----
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [viewers, setViewers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("overview"); // detail tab inside user drawer
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<AdminAnalytics>({
    totalUsers: 0,
    totalVendors: 0,
    totalViewers: 0,
    pendingVerifications: 0,
    totalBookings: 0,
    totalRevenue: 0,
    revenue: 0,
    userGrowth: [],
    bookingTrends: [],
    popularCategories: [],
    serviceTypeStats: [],
    dailyActiveUsers: {
      vendors: 0,
      viewers: 0,
      total: 0
    },
    topViewers: {
      daily: [],
      monthly: [],
      yearly: []
    },
    vendorRatings: [],
    serviceFilters: [],
    bookings: []
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all data in parallel
      const [users, vendorsData, analytics] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllVendors(),
        AdminService.getAnalytics()
      ]);

      // Separate viewers and vendors
      const viewersData = users.filter(user => user.role === 'viewer');
      const vendorUsers = users.filter(user => user.role === 'vendor');

      // Create unified users array with proper typing
      const unifiedUsers: AdminUser[] = users.map(user => ({
        ...user,
        userType: user.role === 'vendor' ? 'vendor' : 'viewer',
        name: user.full_name || user.email,
        avatar: user.avatar_url || undefined,
        category: user.vendor?.category,
        verified: user.vendor?.is_verified,
        views: user.vendor?.review_count || 0,
        inquiries: user.bookings_count || 0,
        packages: [], // Will be populated from vendor data
        availability: [], // Will be populated from vendor data
        bookings: [], // Will be populated from booking data
        notes: `User since ${new Date(user.created_at).toLocaleDateString()}`,
        submittedAt: user.created_at,
        lastActive: user.updated_at,
        status: user.role === 'vendor' ? (user.vendor?.is_verified ? 'verified' : 'pending') : 'active',
        suspended: false, // Will be determined by role check
        instagram: user.vendor?.social_media?.instagram,
        website: user.vendor?.website || undefined
      }));

      setVendors(vendorsData);
      setViewers(viewersData);
      setAllUsers(unifiedUsers);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading admin data:', error);
      // You might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  }

  // ----- Helpers -----
  function filteredUsers(list: any[] = allUsers) {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (user: any) =>
        user.name.toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.phone || "").toLowerCase().includes(q) ||
        (user.instagram || "").toLowerCase().includes(q) ||
        (user.category || "").toLowerCase().includes(q)
    );
  }

  function getFilteredUsers() {
    let filtered = filteredUsers();
    
    switch (userSubTab) {
      case 'viewers':
        return filtered.filter((u: any) => u.userType === 'viewer');
      case 'vendors':
        return filtered.filter((u: any) => u.userType === 'vendor');
      case 'pending':
        return filtered.filter((u: any) => u.userType === 'vendor' && !u.verified);
      default:
        return filtered;
    }
  }

  // ----- Actions (backend integration) -----
  async function verifyVendor(vendorId: string) {
    try {
      await AdminService.verifyVendor(vendorId);
      // Reload data to get updated state
      loadData();
    } catch (error) {
      console.error('Error verifying vendor:', error);
    }
  }

  async function rejectVendor(vendorId: string, reason?: string) {
    try {
      await AdminService.rejectVendor(vendorId, reason);
      // Reload data to get updated state
      loadData();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
    }
  }

  async function hardResetVendor(vendorId: string) {
    try {
      await AdminService.rejectVendor(vendorId, 'Hard reset requested');
      // Reload data to get updated state
      loadData();
    } catch (error) {
      console.error('Error hard resetting vendor:', error);
    }
  }

  async function suspendUser(userId: string) {
    try {
      await AdminService.suspendUser(userId);
      // Reload data to get updated state
      loadData();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  }

  async function activateUser(userId: string) {
    try {
      await AdminService.activateUser(userId);
      // Reload data to get updated state
      loadData();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('adminSession');
      localStorage.removeItem('adminUser');
      router.push('/admin_access');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // ----- Sidebar component -----
  function Sidebar() {
    return (
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-4">
          <h2 className="text-lg font-semibold">GoaFYI Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">GoaFYI admin - Control center</p>
        </div>
        <nav className="p-2 text-sm">
          <div className="mb-2">
            <button 
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`} 
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'users' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`} 
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button 
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`} 
              onClick={() => setActiveTab('analytics')}
            >
              📈 Analytics
            </button>
            <button 
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`} 
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
            <button 
              className="w-full text-left px-3 py-2 rounded text-gray-600 hover:bg-gray-50" 
              onClick={() => router.push('/admin/vendor-onboarding')}
            >
              📝 Vendor Onboarding
            </button>
            <button 
              className="w-full text-left px-3 py-2 rounded text-gray-600 hover:bg-gray-50" 
              onClick={() => router.push('/admin/email-templates')}
            >
              📧 Email Templates
            </button>
            <button 
              className="w-full text-left px-3 py-2 rounded text-gray-600 hover:bg-gray-50" 
              onClick={() => router.push('/admin/email-config')}
            >
              ⚙️ Email Config
            </button>
          </div>
          <div className="px-4 py-2 text-xs text-gray-500">Admin actions</div>
          <div className="px-2 mt-2">
            <button onClick={() => loadData()} className="w-full text-left px-3 py-2 rounded text-sm">Reload data</button>
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded text-sm text-red-600">Logout</button>
          </div>
        </nav>
      </aside>
    );
  }

  // ----- Render -----
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden w-full bg-white p-3 border-b flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setHamburgerOpen((s) => !s)} 
            className="p-2 border rounded-md hover:bg-gray-50"
          >
            ☰
          </button>
           <div>
             <div className="text-sm font-semibold">GoaFYI Admin — {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'users' ? 'Users' : activeTab === 'analytics' ? 'Analytics' : 'Settings'}</div>
             <div className="text-xs text-gray-500">GoaFYI admin - Control center</div>
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadData()} className="px-2 py-1 border rounded-md text-xs">Refresh</button>
          <button onClick={handleLogout} className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs">Logout</button>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Optional mobile menu drawer */}
      {hamburgerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setHamburgerOpen(false)}>
          <div className="bg-white w-80 h-full shadow-lg" onClick={(e) => e.stopPropagation()}>
             <div className="p-4 border-b">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold">GoaFYI Admin Menu</h2>
                 <button onClick={() => setHamburgerOpen(false)} className="p-2 hover:bg-gray-100 rounded-md">✕</button>
               </div>
             </div>
            <nav className="p-4">
              <div className="mb-6">
                <div className="flex flex-col space-y-2">
                  <button 
                    className={`text-left px-3 py-2 rounded text-sm ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600'}`} 
                    onClick={() => { setActiveTab('dashboard'); setHamburgerOpen(false); }}
                  >
                    📊 Dashboard
                  </button>
                  <button 
                    className={`text-left px-3 py-2 rounded text-sm ${activeTab === 'users' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600'}`} 
                    onClick={() => { setActiveTab('users'); setHamburgerOpen(false); }}
                  >
                    👥 Users
                  </button>
                  <button 
                    className={`text-left px-3 py-2 rounded text-sm ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600'}`} 
                    onClick={() => { setActiveTab('analytics'); setHamburgerOpen(false); }}
                  >
                    📈 Analytics
                  </button>
                  <button 
                    className={`text-left px-3 py-2 rounded text-sm ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600'}`} 
                    onClick={() => { setActiveTab('settings'); setHamburgerOpen(false); }}
                  >
                    ⚙️ Settings
                  </button>
                  <button 
                    className="text-left px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-50" 
                    onClick={() => { router.push('/admin/vendor-onboarding'); setHamburgerOpen(false); }}
                  >
                    📝 Vendor Onboarding
                  </button>
                  <button 
                    className="text-left px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-50" 
                    onClick={() => { router.push('/admin/email-templates'); setHamburgerOpen(false); }}
                  >
                    📧 Email Templates
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="px-2 py-2 text-xs text-gray-500">Admin actions</div>
                <div className="flex flex-col">
                  <button onClick={() => { loadData(); setHamburgerOpen(false); }} className="w-full text-left px-3 py-2 rounded text-sm text-gray-600">Reload data</button>
                  <button onClick={() => { handleLogout(); setHamburgerOpen(false); }} className="w-full text-left px-3 py-2 rounded text-sm text-red-600">Logout</button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 p-2 md:p-4">
        {/* Header controls */}
        <header className="mb-3 md:mb-4">
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'users' ? 'Users' : 
                 activeTab === 'analytics' ? 'Analytics' : 'Settings'}
              </h1>
              <p className="text-xs text-gray-500">
                {activeTab === 'dashboard' ? 'Overview of your platform' : 
                 activeTab === 'users' ? 'Manage all users and vendors' : 
                 activeTab === 'analytics' ? 'Platform insights and metrics' : 'System configuration'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'users' && (
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="border rounded-md px-2 py-1 text-xs w-48"
                />
              )}
              <button onClick={() => loadData()} className="px-2 py-1 border rounded-md text-xs">Reload</button>
            </div>
          </div>
          
          {/* Mobile header controls */}
          <div className="md:hidden space-y-2">
            <div>
              <h1 className="text-base font-semibold">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'users' ? 'Users' : 
                 activeTab === 'analytics' ? 'Analytics' : 'Settings'}
              </h1>
              <p className="text-xs text-gray-500">Manage signups, listings and user activity</p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'users' && (
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 border rounded-md px-2 py-1 text-xs"
                />
              )}
              <button onClick={() => loadData()} className="px-2 py-1 border rounded-md text-xs">Reload</button>
            </div>
          </div>
        </header>

         {/* Main content changes by tab */}
         {activeTab === 'dashboard' && (
           <div className="space-y-4">
             {/* Dashboard Overview */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
               <div className="bg-white p-3 rounded-lg shadow-sm">
                 <div className="text-xs text-gray-500">Users</div>
                 <div className="text-lg font-bold text-blue-600">{analyticsData.totalUsers}</div>
               </div>
               <div className="bg-white p-3 rounded-lg shadow-sm">
                 <div className="text-xs text-gray-500">Vendors</div>
                 <div className="text-lg font-bold text-green-600">{analyticsData.totalVendors}</div>
               </div>
               <div className="bg-white p-3 rounded-lg shadow-sm">
                 <div className="text-xs text-gray-500">Pending</div>
                 <div className="text-lg font-bold text-orange-600">{analyticsData.pendingVerifications}</div>
               </div>
               <div className="bg-white p-3 rounded-lg shadow-sm">
                 <div className="text-xs text-gray-500">Bookings</div>
                 <div className="text-lg font-bold text-purple-600">{analyticsData.totalBookings}</div>
               </div>
             </div>

             {/* Quick Actions */}
             <div className="bg-white p-4 rounded-lg shadow-sm">
               <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <button
                   onClick={() => router.push('/admin/vendor-onboarding')}
                   className="flex items-center gap-3 p-3 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                 >
                   <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                     📝
                   </div>
                   <div className="text-left">
                     <div className="text-sm font-medium text-gray-900">Vendor Onboarding</div>
                     <div className="text-xs text-gray-500">Review new vendor applications</div>
                   </div>
                 </button>
                 <button
                   onClick={() => setActiveTab('users')}
                   className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                 >
                   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                     👥
                   </div>
                   <div className="text-left">
                     <div className="text-sm font-medium text-gray-900">Manage Users</div>
                     <div className="text-xs text-gray-500">View and manage all users</div>
                   </div>
                 </button>
               </div>
             </div>

             {/* Recent Activity */}
             <div className="bg-white p-4 rounded-lg shadow-sm">
               <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
               <div className="space-y-2">
                 {allUsers.slice(0, 5).map((user: any) => (
                   <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-2">
                       <img src={user.avatar || "https://placehold.co/32x32"} alt="avatar" className="w-8 h-8 rounded-full" />
                       <div>
                         <div className="text-sm font-medium">{user.name}</div>
                         <div className="text-xs text-gray-500">{user.userType === 'vendor' ? 'Vendor' : 'Viewer'} • {user.lastActive}</div>
                       </div>
                     </div>
                     <div className="text-xs">
                       {user.userType === 'vendor' && !user.verified && (
                         <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Pending</span>
                       )}
                       {user.userType === 'vendor' && user.verified && (
                         <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Verified</span>
                       )}
                       {user.userType === 'viewer' && (
                         <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Active</span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

         {activeTab === 'users' && (
           <div className="space-y-4">
             {/* User Sub-tabs */}
             <div className="bg-white p-3 rounded-lg shadow-sm">
               <div className="flex flex-wrap gap-2">
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${userSubTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setUserSubTab('all')}
                 >
                   All ({allUsers.length})
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${userSubTab === 'viewers' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setUserSubTab('viewers')}
                 >
                   Viewers ({allUsers.filter((u: any) => u.userType === 'viewer').length})
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${userSubTab === 'vendors' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setUserSubTab('vendors')}
                 >
                   Vendors ({allUsers.filter((u: any) => u.userType === 'vendor').length})
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${userSubTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setUserSubTab('pending')}
                 >
                   Pending ({allUsers.filter((u: any) => u.userType === 'vendor' && !u.verified).length})
                 </button>
               </div>
             </div>

             {/* User List */}
             <div className="bg-white rounded-lg shadow-sm">
               <div className="p-3 border-b">
                 <h3 className="text-sm font-semibold">User Management</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {getFilteredUsers().map((user: any) => (
                       <tr key={user.id} className="hover:bg-gray-50">
                         <td className="px-3 py-2">
                           <div className="flex items-center gap-2">
                             <img src={user.avatar || "https://placehold.co/32x32"} alt="avatar" className="w-8 h-8 rounded-full" />
                             <div>
                               <div className="text-sm font-medium">{user.name}</div>
                               <div className="text-xs text-gray-500">{user.email}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-3 py-2">
                           <span className={`px-2 py-1 rounded-full text-xs ${user.userType === 'vendor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                             {user.userType === 'vendor' ? 'Vendor' : 'Viewer'}
                           </span>
                         </td>
                         <td className="px-3 py-2">
                           {user.userType === 'vendor' ? (
                             user.verified ? (
                               <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Verified</span>
                             ) : (
                               <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Pending</span>
                             )
                           ) : (
                             user.suspended ? (
                               <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Suspended</span>
                             ) : (
                               <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                             )
                           )}
                         </td>
                         <td className="px-3 py-2 text-xs text-gray-500">{user.lastActive}</td>
                         <td className="px-3 py-2">
                           <div className="flex gap-1">
                             <button 
                               onClick={() => setSelectedUser(user)} 
                               className="px-2 py-1 border rounded text-xs hover:bg-gray-50"
                             >
                               View
                             </button>
                             {user.userType === 'vendor' && !user.verified && (
                               <button 
                                 onClick={() => verifyVendor(user.id)} 
                                 className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                               >
                                 Verify
                               </button>
                             )}
                             {user.userType === 'viewer' && !user.suspended && (
                               <button 
                                 onClick={() => suspendUser(user.id)} 
                                 className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                               >
                                 Suspend
                               </button>
                             )}
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
         )}

         {activeTab === 'analytics' && (
           <div className="space-y-4">
             {/* Analytics Sub-tabs */}
             <div className="bg-white p-3 rounded-lg shadow-sm">
               <div className="flex flex-wrap gap-2">
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${analyticsSubTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setAnalyticsSubTab('overview')}
                 >
                   Overview
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${analyticsSubTab === 'users' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setAnalyticsSubTab('users')}
                 >
                   Users
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${analyticsSubTab === 'ratings' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setAnalyticsSubTab('ratings')}
                 >
                   Ratings
                 </button>
                 <button 
                   className={`px-3 py-1 rounded-md text-xs ${analyticsSubTab === 'bookings' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                   onClick={() => setAnalyticsSubTab('bookings')}
                 >
                   Bookings
                 </button>
               </div>
             </div>

             {/* Analytics Content */}
             {analyticsSubTab === 'overview' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <h3 className="text-sm font-semibold mb-3">User Growth</h3>
                   <div className="space-y-2">
                     {analyticsData.userGrowth.map((item: any, index: number) => (
                       <div key={index} className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">{item.month}</span>
                         <div className="flex items-center gap-2">
                           <div className="w-24 bg-gray-200 rounded-full h-1.5">
                             <div 
                               className="bg-blue-600 h-1.5 rounded-full" 
                               style={{ width: `${(item.users / 200) * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-xs font-medium">{item.users}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

               </div>
             )}

             {analyticsSubTab === 'users' && (
               <div className="space-y-4">
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <h3 className="text-sm font-semibold mb-3">User Analytics</h3>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="text-center p-3 bg-blue-50 rounded-lg">
                       <div className="text-lg font-bold text-blue-600">{analyticsData.totalViewers}</div>
                       <div className="text-xs text-gray-600">Viewers</div>
                     </div>
                     <div className="text-center p-3 bg-green-50 rounded-lg">
                       <div className="text-lg font-bold text-green-600">{analyticsData.totalVendors}</div>
                       <div className="text-xs text-gray-600">Vendors</div>
                     </div>
                     <div className="text-center p-3 bg-purple-50 rounded-lg">
                       <div className="text-lg font-bold text-purple-600">{analyticsData.pendingVerifications}</div>
                       <div className="text-xs text-gray-600">Pending</div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <h3 className="text-sm font-semibold mb-3">Daily Active Users</h3>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="text-center p-3 bg-green-50 rounded-lg">
                       <div className="text-lg font-bold text-green-600">{analyticsData.dailyActiveUsers.vendors}</div>
                       <div className="text-xs text-gray-600">Active Vendors</div>
                     </div>
                     <div className="text-center p-3 bg-blue-50 rounded-lg">
                       <div className="text-lg font-bold text-blue-600">{analyticsData.dailyActiveUsers.viewers}</div>
                       <div className="text-xs text-gray-600">Active Viewers</div>
                     </div>
                     <div className="text-center p-3 bg-purple-50 rounded-lg">
                       <div className="text-lg font-bold text-purple-600">{analyticsData.dailyActiveUsers.total}</div>
                       <div className="text-xs text-gray-600">Total Active</div>
                     </div>
                   </div>
                 </div>
               </div>
             )}



             {analyticsSubTab === 'ratings' && (
               <div className="bg-white p-4 rounded-lg shadow-sm">
                 <h3 className="text-sm font-semibold mb-3">Vendor Ratings & Performance</h3>
                 <div className="overflow-x-auto">
                   <table className="min-w-full">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                       {analyticsData.vendorRatings.map((vendor: any, index: number) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-3 py-2">
                             <div className="text-sm font-medium">{vendor.name}</div>
                           </td>
                           <td className="px-3 py-2">
                             <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                               {vendor.category}
                             </span>
                           </td>
                           <td className="px-3 py-2">
                             <div className="flex items-center gap-1">
                               <span className="text-yellow-500 text-xs">⭐</span>
                               <span className="text-sm font-medium">{vendor.rating}</span>
                             </div>
                           </td>
                           <td className="px-3 py-2">
                             <span className="text-xs text-gray-600">{vendor.reviews} reviews</span>
                           </td>
                           <td className="px-3 py-2">
                             <span className="text-sm font-medium">{vendor.views.toLocaleString()}</span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {analyticsSubTab === 'vendors' && (
               <div className="bg-white p-6 rounded-lg shadow-sm">
                 <h3 className="text-lg font-semibold mb-4">Vendor Performance</h3>
                 <div className="space-y-4">
                   {vendors.map((vendor: any) => (
                     <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="flex items-center gap-3">
                         <img src={vendor.avatar} alt="avatar" className="w-12 h-12 rounded-full" />
                         <div>
                           <div className="font-medium">{vendor.name}</div>
                           <div className="text-sm text-gray-500">{vendor.category}</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-medium">{vendor.views} views</div>
                         <div className="text-sm text-gray-500">{vendor.inquiries} inquiries</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {analyticsSubTab === 'bookings' && (
               <div className="space-y-4">
                 {/* Booking Summary */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <h3 className="text-sm font-semibold mb-3">Booking Summary</h3>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="text-center p-3 bg-green-50 rounded-lg">
                       <div className="text-lg font-bold text-green-600">{analyticsData.totalBookings}</div>
                       <div className="text-xs text-gray-600">Bookings</div>
                     </div>
                     <div className="text-center p-3 bg-blue-50 rounded-lg">
                       <div className="text-lg font-bold text-blue-600">₹{analyticsData.revenue.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Revenue</div>
                     </div>
                     <div className="text-center p-3 bg-purple-50 rounded-lg">
                       <div className="text-lg font-bold text-purple-600">
                         {analyticsData.totalBookings > 0 ? Math.round(analyticsData.revenue / analyticsData.totalBookings).toLocaleString() : 0}
                       </div>
                       <div className="text-xs text-gray-600">Avg Value</div>
                     </div>
                   </div>
                 </div>

                 {/* All Bookings Table */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <h3 className="text-sm font-semibold mb-3">All Bookings</h3>
                   <div className="overflow-x-auto">
                     <table className="min-w-full">
                       <thead className="bg-gray-50">
                         <tr>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Viewer</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                         {analyticsData.bookings?.map((booking: any) => (
                           <tr key={booking.id} className="hover:bg-gray-50">
                             <td className="px-3 py-2">
                               <div>
                                 <div className="text-sm font-medium">{booking.viewerName}</div>
                                 <div className="text-xs text-gray-500">{booking.viewerEmail}</div>
                               </div>
                             </td>
                             <td className="px-3 py-2">
                               <div>
                                 <div className="text-sm font-medium">{booking.vendorName}</div>
                                 <div className="text-xs text-gray-500">{booking.vendorCategory}</div>
                               </div>
                             </td>
                             <td className="px-3 py-2">
                               <div className="text-xs">{booking.eventType}</div>
                               {booking.notes && (
                                 <div className="text-xs text-gray-500 truncate max-w-24" title={booking.notes}>
                                   {booking.notes}
                                 </div>
                               )}
                             </td>
                             <td className="px-3 py-2 text-xs">
                               {new Date(booking.eventDate).toLocaleDateString()}
                             </td>
                             <td className="px-3 py-2 text-xs">
                               {booking.guestCount || '-'}
                             </td>
                             <td className="px-3 py-2 text-xs font-medium">
                               {booking.budget ? `₹${booking.budget.toLocaleString()}` : '-'}
                             </td>
                             <td className="px-3 py-2">
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                 booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                 booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                 booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {booking.status}
                               </span>
                             </td>
                             <td className="px-3 py-2 text-xs text-gray-500">
                               {new Date(booking.createdAt).toLocaleDateString()}
                             </td>
                           </tr>
                         ))}
                         {(!analyticsData.bookings || analyticsData.bookings.length === 0) && (
                           <tr>
                             <td colSpan={8} className="px-3 py-4 text-center text-gray-500 text-xs">
                               No bookings found
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

         {activeTab === 'settings' && (
           <div className="space-y-6">
             <div className="bg-white p-6 rounded-lg shadow-sm">
               <h3 className="text-lg font-semibold mb-4">System Settings</h3>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div>
                     <div className="font-medium">Email Notifications</div>
                     <div className="text-sm text-gray-500">Send email notifications for new signups and bookings</div>
                   </div>
                   <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Enable</button>
                 </div>
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div>
                     <div className="font-medium">Auto-approve Vendors</div>
                     <div className="text-sm text-gray-500">Automatically approve vendors with complete profiles</div>
                   </div>
                   <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">Disable</button>
                 </div>
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div>
                     <div className="font-medium">Maintenance Mode</div>
                     <div className="text-sm text-gray-500">Put the platform in maintenance mode</div>
                   </div>
                   <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">Disable</button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* User Detail Modal */}
         {selectedUser && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
             <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg p-6">
               <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <img src={selectedUser.avatar || "https://placehold.co/80x80"} alt="avatar" className="w-20 h-20 rounded-full" />
                   <div>
                     <div className="text-xl font-semibold">{selectedUser.name}</div>
                     <div className="text-sm text-gray-500">{selectedUser.email}</div>
                     <div className="text-sm text-gray-500">{selectedUser.userType === 'vendor' ? selectedUser.category : 'Viewer'}</div>
                   </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-md">✕</button>
               </div>

               <div className="space-y-6">
                 {selectedUser.userType === 'vendor' && (
                   <>
                     {/* Vendor Stats */}
                     <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-gray-50 rounded-lg">
                         <div className="text-sm text-gray-500">Views</div>
                         <div className="font-semibold">{selectedUser.views || 0}</div>
                       </div>
                       <div className="p-3 bg-gray-50 rounded-lg">
                         <div className="text-sm text-gray-500">Inquiries</div>
                         <div className="font-semibold">{selectedUser.inquiries || 0}</div>
                       </div>
                     </div>

                     {/* Vendor Details Tabs */}
                     <div className="border-b border-gray-200">
                       <nav className="flex space-x-8">
                         <button
                           onClick={() => setDetailTab('overview')}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${
                             detailTab === 'overview'
                               ? 'border-blue-500 text-blue-600'
                               : 'border-transparent text-gray-500 hover:text-gray-700'
                           }`}
                         >
                           Overview
                         </button>
                         <button
                           onClick={() => setDetailTab('packages')}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${
                             detailTab === 'packages'
                               ? 'border-blue-500 text-blue-600'
                               : 'border-transparent text-gray-500 hover:text-gray-700'
                           }`}
                         >
                           Packages
                         </button>
                         <button
                           onClick={() => setDetailTab('availability')}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${
                             detailTab === 'availability'
                               ? 'border-blue-500 text-blue-600'
                               : 'border-transparent text-gray-500 hover:text-gray-700'
                           }`}
                         >
                           Availability
                         </button>
                         <button
                           onClick={() => setDetailTab('bookings')}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${
                             detailTab === 'bookings'
                               ? 'border-blue-500 text-blue-600'
                               : 'border-transparent text-gray-500 hover:text-gray-700'
                           }`}
                         >
                           Bookings
                         </button>
                       </nav>
                     </div>

                     {/* Tab Content */}
                     <div className="mt-4">
                       {detailTab === 'overview' && (
                         <div className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="p-4 bg-gray-50 rounded-lg">
                               <h4 className="font-medium mb-2">Contact Information</h4>
                               <div className="space-y-1 text-sm">
                                 <div><span className="text-gray-500">Email:</span> {selectedUser.email}</div>
                                 <div><span className="text-gray-500">Phone:</span> {selectedUser.phone}</div>
                                 <div><span className="text-gray-500">Instagram:</span> {selectedUser.instagram}</div>
                                 <div><span className="text-gray-500">Website:</span> 
                                   <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                     Visit
                                   </a>
                                 </div>
                               </div>
                             </div>
                             <div className="p-4 bg-gray-50 rounded-lg">
                               <h4 className="font-medium mb-2">Business Details</h4>
                               <div className="space-y-1 text-sm">
                                 <div><span className="text-gray-500">Category:</span> {selectedUser.category}</div>
                                 <div><span className="text-gray-500">Submitted:</span> {selectedUser.submittedAt}</div>
                                 <div><span className="text-gray-500">Last Active:</span> {selectedUser.lastActive}</div>
                                 <div><span className="text-gray-500">Status:</span> 
                                   <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                     selectedUser.verified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                   }`}>
                                     {selectedUser.verified ? 'Verified' : 'Pending'}
                                   </span>
                                 </div>
                               </div>
                             </div>
                           </div>
                           {selectedUser.notes && (
                             <div className="p-4 bg-blue-50 rounded-lg">
                               <h4 className="font-medium mb-2">Admin Notes</h4>
                               <p className="text-sm text-gray-700">{selectedUser.notes}</p>
                             </div>
                           )}
                         </div>
                       )}

                       {detailTab === 'packages' && (
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <h4 className="font-medium">Service Packages</h4>
                             <span className="text-sm text-gray-500">{selectedUser.packages?.length || 0} packages</span>
                           </div>
                           {selectedUser.packages && selectedUser.packages.length > 0 ? (
                             <div className="space-y-3">
                               {selectedUser.packages.map((pkg: any) => (
                                 <div key={pkg.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                   <div className="flex items-center justify-between">
                                     <div>
                                       <h5 className="font-medium">{pkg.title}</h5>
                                       <p className="text-sm text-gray-500">Package ID: {pkg.id}</p>
                                     </div>
                                     <div className="text-right">
                                       <div className="text-lg font-semibold text-green-600">₹{pkg.price?.toLocaleString()}</div>
                                       <div className="text-xs text-gray-500">per service</div>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-8 text-gray-500">
                               <div className="text-4xl mb-2">📦</div>
                               <p>No packages added yet</p>
                               <p className="text-sm">This vendor hasn't created any service packages</p>
                             </div>
                           )}
                         </div>
                       )}

                       {detailTab === 'availability' && (
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <h4 className="font-medium">Available Dates</h4>
                             <span className="text-sm text-gray-500">{selectedUser.availability?.length || 0} dates</span>
                           </div>
                           {selectedUser.availability && selectedUser.availability.length > 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                               {selectedUser.availability.map((date: string, index: number) => (
                                 <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                   <div className="text-sm font-medium text-green-800">{date}</div>
                                   <div className="text-xs text-green-600">Available</div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-8 text-gray-500">
                               <div className="text-4xl mb-2">📅</div>
                               <p>No availability set</p>
                               <p className="text-sm">This vendor hasn't set their available dates</p>
                             </div>
                           )}
                         </div>
                       )}

                       {detailTab === 'bookings' && (
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <h4 className="font-medium">Recent Bookings</h4>
                             <span className="text-sm text-gray-500">{selectedUser.bookings?.length || 0} bookings</span>
                           </div>
                           {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                             <div className="space-y-3">
                               {selectedUser.bookings.map((booking: any) => (
                                 <div key={booking.id} className="p-4 border rounded-lg">
                                   <div className="flex items-center justify-between">
                                     <div>
                                       <h5 className="font-medium">{booking.client}</h5>
                                       <p className="text-sm text-gray-500">Date: {booking.date}</p>
                                     </div>
                                     <div className="text-right">
                                       <span className={`px-2 py-1 rounded-full text-xs ${
                                         booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                         booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                         'bg-red-100 text-red-800'
                                       }`}>
                                         {booking.status}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-8 text-gray-500">
                               <div className="text-4xl mb-2">📋</div>
                               <p>No bookings yet</p>
                               <p className="text-sm">This vendor hasn't received any bookings</p>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex gap-2 pt-4 border-t">
                       {!selectedUser.verified ? (
                         <>
                           <button 
                             onClick={() => verifyVendor(selectedUser.id)} 
                             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                           >
                             ✓ Verify Vendor
                           </button>
                           <button 
                             onClick={() => {
                               const reason = window.prompt('Reason for rejection:');
                               if (reason !== null) rejectVendor(selectedUser.id, reason);
                             }} 
                             className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                           >
                             ✗ Reject
                           </button>
                         </>
                       ) : (
                         <button 
                           onClick={() => hardResetVendor(selectedUser.id)} 
                           className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                         >
                           🔄 Hard Reset
                         </button>
                       )}
                     </div>
                   </>
                 )}

                 {selectedUser.userType === 'viewer' && (
                   <div className="flex gap-2">
                     {!selectedUser.suspended ? (
                       <button 
                         onClick={() => suspendUser(selectedUser.id)} 
                         className="px-4 py-2 bg-red-600 text-white rounded-md"
                       >
                         Suspend User
                       </button>
                     ) : (
                       <button 
                         onClick={() => activateUser(selectedUser.id)} 
                         className="px-4 py-2 bg-green-600 text-white rounded-md"
                       >
                         Activate User
                       </button>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

         {/* Mobile Bottom Navigation */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
           <div className="flex justify-around">
             <button 
               className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
               onClick={() => setActiveTab('dashboard')}
             >
               <span className="text-lg">📊</span>
               <span className="text-xs">Dashboard</span>
             </button>
             <button 
               className={`flex flex-col items-center p-2 ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-500'}`}
               onClick={() => setActiveTab('users')}
             >
               <span className="text-lg">👥</span>
               <span className="text-xs">Users</span>
             </button>
             <button 
               className={`flex flex-col items-center p-2 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500'}`}
               onClick={() => setActiveTab('analytics')}
             >
               <span className="text-lg">📈</span>
               <span className="text-xs">Analytics</span>
             </button>
             <button 
               className={`flex flex-col items-center p-2 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
               onClick={() => setActiveTab('settings')}
             >
               <span className="text-lg">⚙️</span>
               <span className="text-xs">Settings</span>
             </button>
           </div>
         </div>

      </main>
    </div>
  );
}

/*
Integration notes (update these in your docs):
- Replace demo arrays with server queries (Supabase or your API). Example using Supabase:
  const { data } = await supabase.from('vendors').select('*, packages(*), bookings(*)');
- Protect the page with server-side auth & role check. Only admin should access.
- Analytics: implement event tracking (page view events, inquiries) and aggregate in a separate analytics table or service.
- Bulk actions: if you want bulk actions back, implement a server endpoint that performs batch updates and records an audit log (who performed the action).
- Hard reset: create a backend endpoint that atomically clears vendor bookings/availability and optionally notifies the vendor.
- Viewer management: store a `suspended` boolean on users table. Suspension should revoke session tokens and optionally block new sign-ins.
- Pagination: for production, implement server-side pagination and search indexes. Use cursors or limit/offset.
- Security: log every admin action and restrict write endpoints to admin roles only.
*/

export default function AdminDashboard() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}