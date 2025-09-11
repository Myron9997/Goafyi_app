"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../context/SupabaseContext';
import { VendorService } from '../../../services/vendorService';
import { RequestService } from '../../../services/requestService';
import { PackageService } from '../../../services/packageService';
import { AvailabilityService } from '../../../services/availabilityService';
import { Package, CalendarDays, Inbox, Gauge, CalendarCheck2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState(() => {
    // Try to load cached data immediately
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dashboard-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (now - parsed.timestamp < 120000) {
            return parsed.data;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return {
      requests: 0,
      upcomingBookings: 0,
      packages: 0,
      capacity: 0,
      bookedDates: [] as string[]
    };
  });
  const [showBookedDatesModal, setShowBookedDatesModal] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(() => {
    // Check if we have cached data to avoid loading state
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dashboard-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (now - parsed.timestamp < 120000) {
            return false; // We have valid cached data, no loading needed
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return true; // No cached data, show loading
  });
  
  // Cache for dashboard data (120 seconds)
  const [dashboardCache, setDashboardCache] = useState<{
    data: any;
    timestamp: number;
  } | null>(() => {
    // Try to load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dashboard-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (now - parsed.timestamp < 120000) {
            return parsed;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return null;
  });

  // Function to refresh cache (useful when returning from other pages)
  const refreshDashboardData = () => {
    setDashboardCache(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dashboard-cache');
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  };

  // Check for cached data on mount
  useEffect(() => {
    if (dashboardCache) {
      const now = Date.now();
      const cacheValid = (now - dashboardCache.timestamp) < 120000;
      if (cacheValid) {
        setDashboardLoading(false);
        setDashboardData(dashboardCache.data);
      }
    }
  }, [dashboardCache]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;
        const vendor = await VendorService.getVendorByUserIdCachedFirst(user.id);
        if (vendor && (vendor as any).business_name) {
          setBusinessName((vendor as any).business_name as string);
          setVendorId((vendor as any).id);
        } else if (user.full_name) {
          setBusinessName(user.full_name);
        }
      } catch (e) {
        console.error('Failed to load vendor for dashboard', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.full_name]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!vendorId) return;
      
      // Check if we have valid cached data (120 seconds = 120000ms)
      const now = Date.now();
      const cacheValid = dashboardCache && (now - dashboardCache.timestamp) < 120000;
      
      if (cacheValid) {
        // Use cached data - instant display
        setDashboardLoading(false);
        setDashboardData(dashboardCache.data);
        return;
      }
      
      setDashboardLoading(true);
      try {
        // Load all data in parallel for faster loading
        const [requests, packages, availabilitySettings] = await Promise.all([
          RequestService.listVendorRequests(vendorId),
          PackageService.getVendorPackages(vendorId),
          AvailabilityService.getSettings(vendorId)
        ]);

        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const upcomingBookings = requests.filter(r => r.status === 'confirmed').length;
        const capacity = availabilitySettings?.slots_per_day || 0;
        
        // Get booked dates from confirmed requests
        const bookedDates = requests
          .filter(r => r.status === 'confirmed')
          .flatMap(r => r.dates?.map((d: any) => d.event_date) || [])
          .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates

        const newData = {
          requests: pendingRequests,
          upcomingBookings,
          packages: packages.length,
          capacity,
          bookedDates
        };

        // Cache the data
        const cacheData = {
          data: newData,
          timestamp: now
        };
        setDashboardCache(cacheData);
        
        // Also save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('dashboard-cache', JSON.stringify(cacheData));
          } catch (e) {
            // Ignore localStorage errors
          }
        }

        setDashboardData(newData);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setDashboardLoading(false);
      }
    };
    loadDashboardData();
  }, [vendorId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {loading ? 'Loading…' : businessName || 'Your Business'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Dashboard</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Overview</h2>
            <button
              onClick={refreshDashboardData}
              className={`text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                dashboardCache ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title={dashboardCache ? "Data cached (click to refresh)" : "Refresh data"}
            >
              ↻
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <Inbox className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {dashboardLoading ? '...' : dashboardData.requests}
                </div>
                <div className="text-[11px] text-gray-500">Requests</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {dashboardLoading ? '...' : dashboardData.upcomingBookings}
                </div>
                <div className="text-[11px] text-gray-500">Upcoming bookings</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <Package className="w-4 h-4 text-rose-600" />
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {dashboardLoading ? '...' : dashboardData.packages}
                </div>
                <div className="text-[11px] text-gray-500">Packages</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <Gauge className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {dashboardLoading ? '...' : (dashboardData.capacity || '-')}
                </div>
                <div className="text-[11px] text-gray-500">Capacity / day</div>
              </div>
            </div>
            <div 
              onClick={() => setShowBookedDatesModal(true)}
              className="col-span-2 flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Booked dates</div>
                <div className="text-[11px] text-gray-500">
                  {dashboardLoading 
                    ? 'Loading...' 
                    : dashboardData.bookedDates.length > 0 
                      ? `${dashboardData.bookedDates.length} dates booked` 
                      : 'None yet'
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => router.push('/account/availability')}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Edit availability
            </button>
            <button
              onClick={() => router.push('/account/bookings')}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              View bookings
            </button>
            <button
              onClick={() => router.push('/account/packages')}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Manage packages
            </button>
            <button
              onClick={() => router.push('/account/packages/new')}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Add package
            </button>
          </div>
        </div>
      </div>

      {/* Booked Dates Modal */}
      {showBookedDatesModal && (
        <BookedDatesModal 
          bookedDates={dashboardData.bookedDates}
          onClose={() => setShowBookedDatesModal(false)} 
        />
      )}
    </div>
  );
}

function BookedDatesModal({ bookedDates, onClose }: { bookedDates: string[]; onClose: () => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isBooked: bookedDates.includes(dateStr)
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Booked Dates</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">×</button>
        </div>
        
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <button 
              onClick={() => navigateMonth('next')}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, index) => (
              <div key={index} className="aspect-square flex items-center justify-center">
                {day ? (
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium ${
                      day.isBooked 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {day.day}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span className="text-gray-500">Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-gray-500">Available</span>
            </div>
          </div>

          {/* Booked Dates List */}
          {bookedDates.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">All Booked Dates:</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {bookedDates.sort().map(date => (
                  <div key={date} className="text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                    {new Date(date).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-0">
          <button 
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
