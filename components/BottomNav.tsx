"use client";

import React, { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, User, LayoutDashboard, Calendar, Inbox } from 'lucide-react';
import { SupabaseContext } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseContext = useContext(SupabaseContext);
  const { user } = supabaseContext || { user: null };
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => pathname === path;

  // Debug logging
  console.log('BottomNav: pathname =', pathname);

  // Fetch unread message count for vendors
  useEffect(() => {
    if (user?.role === 'vendor' && user?.id) {
      const fetchUnreadCount = async () => {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      };

      fetchUnreadCount();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          }, 
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, user?.role]);

  const getNavItems = () => {
    if (user?.role === 'vendor') {
      return [
        { path: '/account/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: isActive('/account/dashboard') },
        { path: '/account/availability', icon: Calendar, label: 'Availability', active: isActive('/account/availability') },
        { path: '/account/bookings', icon: Inbox, label: 'Bookings', active: isActive('/account/bookings'), badge: unreadCount },
        { path: '/account', icon: User, label: 'Profile', active: isActive('/account') }
      ];
    }
    if (user?.role === 'viewer') {
      return [
        { path: '/home', icon: Home, label: 'Home', active: isActive('/home') },
        { path: '/viewer/bookings', icon: Inbox, label: 'Bookings', active: isActive('/viewer/bookings') },
        { path: '/account', icon: User, label: 'Profile', active: isActive('/account') }
      ];
    }
    return [] as Array<{ path: string; icon: any; label: string; active: boolean; badge?: number }>;
  };

  const navItems = getNavItems();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40 safe-area shadow-lg transition-colors duration-300">
      <div className="max-w-md mx-auto px-3 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'text-rose-600 bg-rose-50/80 dark:bg-rose-900/20 scale-105'
                    : 'text-gray-400 dark:text-gray-500 hover:text-rose-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:scale-105'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${item.active ? 'drop-shadow-sm' : ''}`} />
                  {item.active && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></div>
                  )}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-0.5 leading-tight ${
                  item.active ? 'text-rose-600' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

