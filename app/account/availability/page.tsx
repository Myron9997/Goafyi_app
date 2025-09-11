"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '../../../context/SupabaseContext';
import { VendorService } from '../../../services/vendorService';
import { BookingService } from '../../../services/bookingService';
import { AvailabilityService } from '../../../services/availabilityService';
import { PackageService } from '../../../services/packageService';

type PackageItem = {
  id: string;
  title: string;
  durationLabel: string;
  pricingType: 'fixed' | 'per_person';
  price?: number;
  pricePerPerson?: number;
  minPersons?: number;
  deliverables?: string[];
  extras?: Array<{
    name: string;
    availableQty?: number;
    pricePerUnit?: number;
  }>;
  terms?: string;
};

function AvailabilityPageContent() {
  const searchParams = useSearchParams();
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'packages' | 'availability'>('packages');
  const [packages, setPackages] = useState<PackageItem[]>(() => {
    // Try to load cached data immediately
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('packages-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (now - parsed.timestamp < 60000) { // 60 seconds
            return parsed.data;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return [];
  });
  const [showPkgModal, setShowPkgModal] = useState(false);
  
  // Cache for packages (60 seconds)
  const [packagesCache, setPackagesCache] = useState<{
    data: PackageItem[];
    timestamp: number;
  } | null>(() => {
    // Try to load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('packages-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (now - parsed.timestamp < 60000) { // 60 seconds
            return parsed;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return null;
  });

  // Function to invalidate packages cache
  const invalidatePackagesCache = () => {
    setPackagesCache(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('packages-cache');
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  };
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState<number>(0);
  const [pkgPricingType, setPkgPricingType] = useState<'fixed' | 'per_person'>('fixed');
  const [pkgPricePerPerson, setPkgPricePerPerson] = useState<number>(0);
  const [pkgMinPersons, setPkgMinPersons] = useState<number | undefined>(undefined);
  const [pkgDuration, setPkgDuration] = useState('');
  const [pkgDeliverables, setPkgDeliverables] = useState<string>('');
  const [pkgExtras, setPkgExtras] = useState<PackageItem['extras']>([]);
  const [pkgTerms, setPkgTerms] = useState<string>('');

  const [slotsPerDay, setSlotsPerDay] = useState<number>(3);
  const [daysOff, setDaysOff] = useState<Record<string, boolean>>({
    Sun: false, Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false
  });
  const [blockedDateInput, setBlockedDateInput] = useState('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [saveNotice, setSaveNotice] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [summaryCursor, setSummaryCursor] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load saved availability from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem('availability_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.slotsPerDay === 'number') setSlotsPerDay(parsed.slotsPerDay);
        // bufferMins removed
        if (parsed?.daysOff && typeof parsed.daysOff === 'object') setDaysOff(parsed.daysOff);
        if (Array.isArray(parsed?.blockedDates)) setBlockedDates(parsed.blockedDates);
      }
    } catch {}
  }, []);

  // Auto-open form if navigated with ?edit=1
  useEffect(() => {
    const edit = searchParams?.get('edit');
    if (edit === '1') setShowForm(true);
  }, [searchParams]);

  // Resolve vendorId from current user
  useEffect(() => {
    const run = async () => {
      try {
        if (!user?.id) return;
        const vendor = await VendorService.getVendorByUserIdCachedFirst(user.id);
        if (vendor && (vendor as any).id) setVendorId((vendor as any).id as string);
      } catch (e) { console.error(e); }
    };
    run();
  }, [user?.id]);

  // Load bookings for the visible month
  useEffect(() => {
    const loadMonth = async () => {
      try {
        if (!vendorId) return;
        const all = await BookingService.getVendorBookings(vendorId);
        // Bucket by date for the current month
        const y = summaryCursor.getFullYear();
        const m = summaryCursor.getMonth();
        const startIso = new Date(y, m, 1).toISOString().slice(0, 10);
        const endIso = new Date(y, m + 1, 0).toISOString().slice(0, 10);
        const bucket: Record<string, any[]> = {};
        for (const b of all) {
          const dateIso = (b as any).event_date as string;
          if (!dateIso) continue;
          if (dateIso >= startIso && dateIso <= endIso) {
            if (!bucket[dateIso]) bucket[dateIso] = [];
            bucket[dateIso].push(b);
          }
        }
        setBookingsByDate(bucket);
      } catch (e) { console.error(e); }
    };
    loadMonth();
  }, [vendorId, summaryCursor]);

  // Load availability settings and blocked dates from Supabase
  useEffect(() => {
    const run = async () => {
      try {
        if (!vendorId) return;
        const settings = await AvailabilityService.getSettings(vendorId);
        if (settings) {
          if (typeof settings.slots_per_day === 'number') setSlotsPerDay(settings.slots_per_day);
          if (settings.days_off && typeof settings.days_off === 'object') setDaysOff(settings.days_off as any);
        }
        const blocked = await AvailabilityService.listBlockedDates(vendorId);
        setBlockedDates(blocked.map(b => b.date));
      } catch (e) { console.error(e); }
    };
    run();
  }, [vendorId]);

  // Load packages from Supabase (with extras) - with caching
  useEffect(() => {
    const run = async () => {
      try {
        if (!vendorId) return;
        
        // Check if we have valid cached data (60 seconds)
        const now = Date.now();
        const cacheValid = packagesCache && (now - packagesCache.timestamp) < 60000;
        
        if (cacheValid) {
          // Use cached data
          setPackages(packagesCache.data);
          return;
        }
        
        // Fetch fresh data
        const data = await PackageService.getVendorPackages(vendorId);
        const mapped: PackageItem[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          pricingType: p.pricing_type,
          price: p.price ?? undefined,
          pricePerPerson: p.price_per_person ?? undefined,
          minPersons: p.min_persons ?? undefined,
          durationLabel: p.duration_label ?? '',
          deliverables: p.deliverables ?? [],
          terms: p.terms ?? '',
          extras: (p.package_extras || []).map((ex: any) => ({
            name: ex.name,
            availableQty: ex.available_qty ?? undefined,
            pricePerUnit: ex.price_per_unit ?? undefined
          }))
        }));
        
        // Cache the data
        const cacheData = {
          data: mapped,
          timestamp: now
        };
        setPackagesCache(cacheData);
        
        // Also save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('packages-cache', JSON.stringify(cacheData));
          } catch (e) {
            // Ignore localStorage errors
          }
        }
        
        setPackages(mapped);
      } catch (e) { console.error(e); }
    };
    run();
  }, [vendorId, packagesCache]);

  const openAddModal = () => {
    setEditingPkg(null);
    setPkgTitle('');
    setPkgPrice(0);
    setPkgPricingType('fixed');
    setPkgPricePerPerson(0);
    setPkgMinPersons(undefined);
    setPkgDuration('');
    setPkgDeliverables('');
    setPkgExtras([]);
    setPkgTerms('');
    setShowPkgModal(true);
  };

  const openEditModal = (pkg: PackageItem) => {
    setEditingPkg(pkg);
    setPkgTitle(pkg.title);
    setPkgPricingType(pkg.pricingType);
    setPkgPrice(pkg.price || 0);
    setPkgPricePerPerson(pkg.pricePerPerson || 0);
    setPkgMinPersons(pkg.minPersons);
    setPkgDuration(pkg.durationLabel);
    setPkgDeliverables((pkg.deliverables || []).join('\n'));
    setPkgExtras(pkg.extras || []);
    setPkgTerms(pkg.terms || '');
    setShowPkgModal(true);
  };

  const savePackage = async () => {
    if (!pkgTitle.trim()) return;
    const deliverablesArray = pkgDeliverables
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    try {
      if (!vendorId) return;
      if (editingPkg) {
        // Update package
        await PackageService.updatePackage(editingPkg.id, {
          title: pkgTitle,
          pricing_type: pkgPricingType,
          price: pkgPricingType === 'fixed' ? pkgPrice : null,
          price_per_person: pkgPricingType === 'per_person' ? pkgPricePerPerson : null,
          min_persons: pkgPricingType === 'per_person' ? (pkgMinPersons ?? null) : null,
          duration_label: pkgDuration,
          deliverables: deliverablesArray,
          terms: pkgTerms
        } as any);
        // Replace extras
        await PackageService.replaceExtras(editingPkg.id, (pkgExtras || []).map(ex => ({
          name: ex.name,
          available_qty: ex.availableQty ?? null,
          price_per_unit: ex.pricePerUnit ?? null
        })) as any);
      } else {
        // Create package, then extras
        const created = await PackageService.createPackage({
          vendor_id: vendorId,
          title: pkgTitle,
          pricing_type: pkgPricingType,
          price: pkgPricingType === 'fixed' ? pkgPrice : null,
          price_per_person: pkgPricingType === 'per_person' ? pkgPricePerPerson : null,
          min_persons: pkgPricingType === 'per_person' ? (pkgMinPersons ?? null) : null,
          duration_label: pkgDuration,
          deliverables: deliverablesArray,
          terms: pkgTerms
        } as any);
        await PackageService.replaceExtras(created.id, (pkgExtras || []).map(ex => ({
          name: ex.name,
          available_qty: ex.availableQty ?? null,
          price_per_unit: ex.pricePerUnit ?? null
        })) as any);
      }
      // Invalidate cache and reload packages
      invalidatePackagesCache();
      const data = await PackageService.getVendorPackages(vendorId);
      const mapped: PackageItem[] = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        pricingType: p.pricing_type,
        price: p.price ?? undefined,
        pricePerPerson: p.price_per_person ?? undefined,
        minPersons: p.min_persons ?? undefined,
        durationLabel: p.duration_label ?? '',
        deliverables: p.deliverables ?? [],
        terms: p.terms ?? '',
        extras: (p.package_extras || []).map((ex: any) => ({
          name: ex.name,
          availableQty: ex.available_qty ?? undefined,
          pricePerUnit: ex.price_per_unit ?? undefined
        }))
      }));
      
      // Update cache with new data
      const now = Date.now();
      const cacheData = {
        data: mapped,
        timestamp: now
      };
      setPackagesCache(cacheData);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('packages-cache', JSON.stringify(cacheData));
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      setPackages(mapped);
    } catch (e) { console.error(e); }
    setShowPkgModal(false);
  };

  const deletePackage = async (id: string) => {
    try { 
      await PackageService.deletePackage(id);
      // Invalidate cache after deletion
      invalidatePackagesCache();
    } catch (e) { console.error(e); }
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleDayOff = (day: keyof typeof daysOff) => setDaysOff((prev) => ({ ...prev, [day]: !prev[day] }));

  const addBlockedDate = async () => {
    const v = blockedDateInput.trim();
    if (!v) return;
    setBlockedDateInput('');
    setBlockedDates((prev) => prev.includes(v) ? prev : [...prev, v]);
    try {
      if (vendorId) await AvailabilityService.addBlockedDates(vendorId, [v]);
    } catch (e) { console.error(e); }
  };

  const removeBlockedDate = async (date: string) => {
    setBlockedDates((prev) => prev.filter((d) => d !== date));
    try {
      if (vendorId) await AvailabilityService.removeBlockedDate(vendorId, date);
    } catch (e) { console.error(e); }
  };

  const currency = useMemo(() => '₹', []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Availability</h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'packages' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'availability' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Availability
          </button>
        </div>

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Packages</h2>
              <button onClick={openAddModal} className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">+ Add</button>
            </div>

            <div className="space-y-2">
              {packages.length === 0 && (
                <div className="text-xs text-gray-500">No packages yet</div>
              )}
              {packages.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.title}</div>
                      <div className="text-[11px] text-gray-500">
                        {p.pricingType === 'fixed' ? (
                          <>{p.durationLabel} • {currency}{p.price}</>
                        ) : (
                          <>{currency}{p.pricePerPerson} per person{p.minPersons ? ` • min ${p.minPersons}` : ''}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(p)} className="px-2 py-1 rounded-md text-[11px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Edit</button>
                      <button onClick={() => deletePackage(p.id)} className="px-2 py-1 rounded-md text-[11px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Delete</button>
                    </div>
                  </div>
                  {p.deliverables && p.deliverables.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-0.5">
                      {p.deliverables.map((d, idx) => (
                        <li key={idx} className="text-[11px] text-gray-600 dark:text-gray-300">{d}</li>
                      ))}
                    </ul>
                  )}
                  {p.extras && p.extras.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Extras</div>
                      <ul className="space-y-1">
                        {p.extras.map((e, i) => (
                          <li key={i} className="text-[11px] text-gray-600 dark:text-gray-300">
                            {e.name}
                            {typeof e.availableQty === 'number' ? ` — available ${e.availableQty}` : ''}
                            {typeof e.pricePerUnit === 'number' ? ` • ${currency}${e.pricePerUnit}/unit` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.terms && (
                    <div className="mt-2">
                      <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Terms & conditions</div>
                      <div className="text-[11px] whitespace-pre-line text-gray-600 dark:text-gray-300">{p.terms}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Availability</h2>
              <button onClick={() => setShowForm((s) => !s)} className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                {showForm ? 'Hide form' : 'Edit availability'}
              </button>
            </div>

            {showForm && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Slots per day</label>
                <input type="number" value={slotsPerDay} onChange={(e) => setSlotsPerDay(parseInt(e.target.value || '0'))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              
              {/* Calendar multi-select */}
              <CalendarMultiSelect
                blockedDates={blockedDates}
                onAddDates={async (dates) => {
                  if (!dates || dates.length === 0) return;
                  // optimistic update
                  setBlockedDates((prev) => Array.from(new Set([...prev, ...dates])).sort());
                  try {
                    if (vendorId) {
                      await AvailabilityService.addBlockedDates(vendorId, dates);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Recurring days off</label>
                <div className="grid grid-cols-7 gap-1">
                  {Object.keys(daysOff).map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDayOff(d as any)}
                      className={`px-2 py-2 rounded-md text-[11px] border ${daysOff[d as keyof typeof daysOff] ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Blocked dates</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    placeholder="YYYY-MM-DD"
                    value={blockedDateInput}
                    onChange={(e) => setBlockedDateInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                  <button onClick={addBlockedDate} className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Add</button>
                </div>
                {blockedDates.length === 0 ? (
                  <div className="text-xs text-gray-500">No blocked dates</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blockedDates.map((d) => (
                      <div key={d} className="px-2 py-1 rounded-md text-[11px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <span>{d}</span>
                        <button onClick={() => removeBlockedDate(d)} className="text-gray-500 hover:text-rose-600">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={async () => {
                    try {
                      if (!vendorId) return;
                      await AvailabilityService.upsertSettings({ vendor_id: vendorId, slots_per_day: slotsPerDay, days_off: daysOff });
                      setSaveNotice('Saved');
                      setTimeout(() => setSaveNotice(''), 1500);
                      setShowForm(false);
                    } catch (e) { console.error(e); }
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700"
                >
                  Save availability
                </button>
                {saveNotice && (
                  <div className="mt-2 text-[11px] text-emerald-600">{saveNotice}</div>
                )}
              </div>
            </div>
            )}

            {/* Monthly summary */}
            <AvailabilitySummary
              daysOff={daysOff}
              blockedDates={blockedDates}
              cursor={summaryCursor}
              setCursor={setSummaryCursor}
              bookingsByDate={bookingsByDate}
              onDateClick={(iso) => setSelectedDate(iso)}
            />
          </div>
        )}
      {/* Bookings modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bookings on {selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)} className="text-gray-500">×</button>
            </div>
            <div className="p-4 space-y-2">
              {(bookingsByDate[selectedDate] || []).length === 0 ? (
                <div className="text-xs text-gray-500">No bookings found</div>
              ) : (
                (bookingsByDate[selectedDate] || []).map((b, i) => (
                  <div key={i} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{(b as any).user?.full_name || 'Client'}</div>
                    <div className="text-[11px] text-gray-500">Package: {(b as any).package_title || (b as any).package_name || '—'}</div>
                    <div className="text-[11px] text-gray-500">Status: {(b as any).status || '—'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Package Modal */}
      {showPkgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{editingPkg ? 'Edit package' : 'Add package'}</h3>
              <button onClick={() => setShowPkgModal(false)} className="text-gray-500">×</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input value={pkgTitle} onChange={(e) => setPkgTitle(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pricing type</label>
                <select value={pkgPricingType} onChange={(e) => setPkgPricingType(e.target.value as any)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                  <option value="fixed">Fixed price</option>
                  <option value="per_person">Per person</option>
                </select>
              </div>
              {pkgPricingType === 'fixed' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                  <input type="number" inputMode="decimal" step="0.01" min="0" value={pkgPrice} onChange={(e) => setPkgPrice(parseFloat(e.target.value || '0'))} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>
              )}
              {pkgPricingType === 'per_person' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price per person</label>
                    <input type="number" inputMode="decimal" step="0.01" min="0" value={pkgPricePerPerson} onChange={(e) => setPkgPricePerPerson(parseFloat(e.target.value || '0'))} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min persons (optional)</label>
                    <input type="number" inputMode="numeric" step="1" min="0" value={pkgMinPersons ?? ''} onChange={(e) => setPkgMinPersons(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                <input value={pkgDuration} onChange={(e) => setPkgDuration(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Deliverables</label>
                <textarea value={pkgDeliverables} onChange={(e) => setPkgDeliverables(e.target.value)} placeholder="Enter one per line" className="w-full h-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              {/* Extras editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Extras</label>
                  <button onClick={() => setPkgExtras([...(pkgExtras || []), { name: '', availableQty: undefined, pricePerUnit: undefined }])} className="text-[11px] px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">+ Add extra</button>
                </div>
                <div className="space-y-2">
                  {(pkgExtras || []).map((ex, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Name</label>
                        <input value={ex.name} onChange={(e) => {
                          const next = [...(pkgExtras || [])];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setPkgExtras(next);
                        }} className="w-full px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Available qty</label>
                        <input type="number" inputMode="numeric" step="1" min="0" value={ex.availableQty ?? ''} onChange={(e) => {
                          const next = [...(pkgExtras || [])];
                          next[idx] = { ...next[idx], availableQty: e.target.value ? parseInt(e.target.value) : undefined };
                          setPkgExtras(next);
                        }} className="w-full px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">Price per unit</label>
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={ex.pricePerUnit ?? ''} onChange={(e) => {
                          const next = [...(pkgExtras || [])];
                          next[idx] = { ...next[idx], pricePerUnit: e.target.value ? parseFloat(e.target.value) : undefined };
                          setPkgExtras(next);
                        }} className="w-full px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
                      </div>
                      <div>
                        <button onClick={() => {
                          const next = [...(pkgExtras || [])];
                          next.splice(idx, 1);
                          setPkgExtras(next);
                        }} className="px-2 py-1.5 rounded-md text-[11px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Terms & conditions</label>
                <textarea value={pkgTerms} onChange={(e) => setPkgTerms(e.target.value)} placeholder="Payment, cancellation, overtime, etc." className="w-full h-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => setShowPkgModal(false)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button onClick={savePackage} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lightweight multi-date calendar with month select
function CalendarMultiSelect({ blockedDates, onAddDates }: { blockedDates: string[]; onAddDates: (dates: string[]) => void }) {
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const format = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const days: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(format(year, month, d));

  const toggle = (iso: string) => {
    if (!iso) return;
    if (blockedDates.includes(iso)) return; // already blocked
    // Persist immediately
    onAddDates([iso]);
  };

  const addSelected = () => {
    if (selected.size === 0) return;
    onAddDates(Array.from(selected));
    setSelected(new Set());
  };

  const selectWholeMonth = () => {
    const all: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) all.push(format(year, month, d));
    onAddDates(all);
    setSelected(new Set());
  };

  const prevMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Select dates to block</div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded-md text-[11px] border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">‹</button>
          <div className="text-xs text-gray-700 dark:text-gray-300 w-28 text-center">
            {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 rounded-md text-[11px] border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (<div key={d} className="text-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((iso, idx) => (
          <button
            key={idx}
            disabled={!iso}
            onClick={() => iso && toggle(iso)}
            className={`h-8 rounded-md text-xs border ${
              !iso ? 'bg-transparent border-transparent' :
              blockedDates.includes(iso) ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-700 cursor-not-allowed' :
              'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            }`}
          >
            {iso ? iso.split('-')[2] : ''}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={addSelected} className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Add selected dates</button>
        <button onClick={selectWholeMonth} className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Select whole month</button>
      </div>
    </div>
  );
}

function AvailabilitySummary({ daysOff, blockedDates, cursor, setCursor, bookingsByDate, onDateClick }: {
  daysOff: Record<string, boolean>;
  blockedDates: string[];
  cursor: Date;
  setCursor: (d: Date) => void;
  bookingsByDate: Record<string, any[]>;
  onDateClick: (iso: string) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const format = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const isDayOff = (date: Date) => daysOff[dayNames[date.getDay() as any]] === true;

  const cells: { iso: string | null; status?: 'available' | 'blocked' | 'dayoff'; hasBookings?: boolean }[] = Array(firstDay).fill({ iso: null });
  let availableCount = 0, blockedCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = format(year, month, d);
    const date = new Date(year, month, d);
    const blocked = blockedDates.includes(iso);
    const dayoff = isDayOff(date);
    const hasBookings = (bookingsByDate[iso] || []).length > 0;
    let status: 'available' | 'blocked' | 'dayoff' = 'available';
    if (blocked) { status = 'blocked'; blockedCount++; }
    else if (dayoff) { status = 'dayoff'; }
    else { availableCount++; }
    cells.push({ iso, status, hasBookings });
  }

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Monthly summary</div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded-md text-[11px] border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">‹</button>
          <div className="text-xs text-gray-700 dark:text-gray-300 w-32 text-center">
            {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 rounded-md text-[11px] border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">›</button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-2 text-[11px]">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"></span> Available: {availableCount}</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-800"></span> Not available: {blockedCount}</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-50 dark:bg-gray-800/60"></span> Days off</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1">
        {dayNames.map((d) => (<div key={d} className="text-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, idx) => (
          <button key={idx} disabled={!c.iso} onClick={() => c.iso && onDateClick(c.iso)} className={`h-7 rounded-md text-xs border flex items-center justify-center relative ${
            !c.iso ? 'bg-transparent border-transparent' :
            c.status === 'blocked' ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-700' :
            c.status === 'dayoff' ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700' :
            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
          }`}>
            {c.iso ? c.iso.split('-')[2] : ''}
            {c.hasBookings && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <AvailabilityPageContent />
    </Suspense>
  );
}


