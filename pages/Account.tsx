"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { type AuthUser } from '../services/authService';
import { VendorService } from '../services/vendorService';
import type { Database } from '../lib/supabase';
import { CATEGORIES } from '../constants';
import { revalidateVendorCache } from '../app/actions/revalidate-cache';

export default function Account({ initialVendor }: { initialVendor?: any } = {}) {
  const router = useRouter();
  const { user, updateProfile } = useSupabase();
  const [fallbackUser, setFallbackUser] = useState<AuthUser | null>(null);
  const [vendor, setVendor] = useState<Database['public']['Tables']['vendors']['Row'] | null>(initialVendor || null);
  const [loading, setLoading] = useState(!initialVendor);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable form state for vendor profile
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('Account useEffect: user from context:', user);
    
    // If we have initial vendor data from SSR, use it immediately
    if (initialVendor && initialVendor.id) {
      console.log('Account: using initial vendor data from SSR:', initialVendor);
      setVendor(initialVendor);
      setLoading(false);
      
      // Initialize form with SSR data
      setFullName(initialVendor.user?.full_name || '');
      setBusinessName(initialVendor.business_name || '');
      setWhatsappNumber(initialVendor.contact_phone || '');
      setWebsiteUrl(initialVendor.website || '');
      const sm: any = initialVendor.social_media || {};
      setFacebookUrl(sm.facebook || '');
      setInstagramUrl(sm.instagram || '');
      const types = (initialVendor.category || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      setSelectedTypes(types);
      setIsEditing(false);
      
      // Refresh data in background for next visit
      loadVendorInBackground();
      return;
    }
    
    const ensureUser = async () => {
      try {
        if (!user) {
          console.log('Account: no user from context, checking session...');
          // Get session directly instead of calling getCurrentUser
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Account: got session:', session?.user?.id);
          if (session?.user) {
            const meta: any = session.user.user_metadata || {}
            const profile = {
              id: session.user.id,
              email: session.user.email!,
              full_name: meta.full_name,
              avatar_url: meta.avatar_url,
              phone: meta.phone,
              role: meta.role || 'viewer',
              created_at: session.user.created_at
            };
            console.log('Account: setting fallback user:', profile);
            setFallbackUser(profile);
          }
        }
      } catch (e) {
        console.error('Account ensureUser error:', e);
      }
    };
    ensureUser();

    // Also listen for auth changes so a fresh SIGNED_IN updates immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Account: onAuthStateChange', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session?.user) {
        const meta: any = session.user.user_metadata || {}
        const profile = {
          id: session.user.id,
          email: session.user.email!,
          full_name: meta.full_name,
          avatar_url: meta.avatar_url,
          phone: meta.phone,
          role: meta.role || 'viewer',
          created_at: session.user.created_at
        } as AuthUser;
        console.log('Account: onAuthStateChange setting fallback user:', profile);
        setFallbackUser(profile);
      }
      if (event === 'SIGNED_OUT') {
        setFallbackUser(null);
      }
    });

    const effectiveUser = user || fallbackUser;
    if (!effectiveUser) {
      // Allow brief time for auth listener to populate before declaring not signed in
      setTimeout(() => setLoading(false), 1200);
      return;
    }
    (async () => {
      try {
        let v = null;
        // Only query vendors table for vendors, not viewers
        if (effectiveUser.role === 'vendor') {
          v = await VendorService.getVendorByUserIdCachedFirst(effectiveUser.id);
          setVendor(v);
        }
        
        
        // Initialize form with current values
        setFullName(effectiveUser.full_name || '');
        if (v) {
          setIsEditing(false);
          setBusinessName(v.business_name || '');
          setWhatsappNumber(v.contact_phone || '');
          setWebsiteUrl(v.website || '');
          const sm: any = v.social_media || {};
          setFacebookUrl(sm.facebook || '');
          setInstagramUrl(sm.instagram || '');
          const types = (v.category || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          setSelectedTypes(types);
        } else {
          // For viewers, start in edit mode if no vendor profile exists
          setIsEditing(effectiveUser.role === 'viewer');
          setBusinessName('');
          setWhatsappNumber('');
          setWebsiteUrl('');
          setFacebookUrl('');
          setInstagramUrl('');
          setSelectedTypes([]);
        }
      } catch (e) {
        console.error('Account load error:', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      subscription.unsubscribe();
    }
  }, [user, fallbackUser, initialVendor]);

  // Background refresh function
  const loadVendorInBackground = async () => {
    const effectiveUser = user || fallbackUser;
    if (!effectiveUser || effectiveUser.role !== 'vendor') return;
    
    try {
      const v = await VendorService.getVendorByUserIdCachedFirst(effectiveUser.id);
      if (v) {
        setVendor(v);
        
        // Update form with fresh data
        setFullName(effectiveUser.full_name || '');
        setBusinessName(v.business_name || '');
        setWhatsappNumber(v.contact_phone || '');
        setWebsiteUrl(v.website || '');
        const sm: any = v.social_media || {};
        setFacebookUrl(sm.facebook || '');
        setInstagramUrl(sm.instagram || '');
        const types = (v.category || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        setSelectedTypes(types);
      }
    } catch (error) {
      console.error('Error refreshing vendor data in background:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const effectiveUser = user || fallbackUser;
  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not signed in</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your account.</p>
          <button
            onClick={() => router.push('/viewer-login')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isViewer = effectiveUser.role === 'viewer'

  // const handleLogout = async () => {
  //   await signOut();
  //   router.push('/');
  // };

  const handleSaveViewerProfile = async () => {
    try {
      setSaving(true);
      
      // Update both users table and auth metadata
      const updates: any = {};
      if ((effectiveUser.full_name || '') !== fullName) {
        updates.full_name = fullName;
      }
      
      if (profileFile) {
        const ext = profileFile.name.split('.').pop();
        const fileName = `${effectiveUser.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('vendor-images').upload(fileName, profileFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('vendor-images').getPublicUrl(fileName);
        updates.avatar_url = data.publicUrl;
        setProfileFile(null);
      }
      
      // Update users table first
      if (Object.keys(updates).length > 0) {
        const { error: dbError } = await supabase.from('users').update(updates).eq('id', effectiveUser.id);
        if (dbError) {
          console.error('Database update error:', dbError);
          throw dbError;
        }
      }
      
      // Update auth metadata (for immediate UI update)
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }
      
      // Update local fallback user state if using fallback
      if (fallbackUser && Object.keys(updates).length > 0) {
        setFallbackUser({ ...fallbackUser, ...updates });
      }
      
      // Refresh the page to ensure all data is updated
      window.location.reload();
      
    } catch (e) {
      console.error('Save viewer profile error:', e);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSaveProfile = async () => {
    if (!effectiveUser) return;
    try {
      setSaving(true);
      // Update user full name
      if ((effectiveUser.full_name || '') !== fullName) {
        await supabase
          .from('users')
          .update({ full_name: fullName })
          .eq('id', effectiveUser.id);
      }

      const updates: any = {
        business_name: businessName,
        contact_phone: whatsappNumber || null,
        website: websiteUrl || null,
        social_media: {
          facebook: facebookUrl || null,
          instagram: instagramUrl || null
        },
        category: selectedTypes.join(', ')
      };

      let ensuredVendor = vendor;
      if (!ensuredVendor) {
        const created = await VendorService.createVendor({
          user_id: effectiveUser.id,
          business_name: businessName,
          description: null as any,
          category: selectedTypes.join(', '),
          location: 'Goa',
          price_range: null as any,
          contact_phone: whatsappNumber || null,
          website: websiteUrl || null,
          social_media: {
            facebook: facebookUrl || null,
            instagram: instagramUrl || null
          } as any,
          availability: null as any,
          contact_email: effectiveUser.email
        } as any);
        ensuredVendor = created;
        setVendor(created);
      }

      // If cover/profile files selected, upload them now
      if (ensuredVendor) {
        let coverUrl: string | null = null;
        if (coverFile) {
          coverUrl = await VendorService.uploadVendorImage(ensuredVendor.id, coverFile);
          const currentImages = (ensuredVendor as any).portfolio_images || [];
          const newImages = [...currentImages];
          newImages[0] = coverUrl;
          await VendorService.updatePortfolioImages(ensuredVendor.id, newImages);
          // Update local vendor state snapshot
          ensuredVendor = { ...(ensuredVendor as any), portfolio_images: newImages } as any;
          setVendor(ensuredVendor);
        }

        if (profileFile) {
          const avatarUrl = await VendorService.uploadVendorImage((ensuredVendor as any).id, profileFile);
          await updateProfile({ avatar_url: avatarUrl } as any);
        }
      }

      // Finally, persist basic vendor fields
      if (ensuredVendor) {
        const updated = await VendorService.updateVendor(ensuredVendor.id, updates);
        setVendor(updated);
        
        // Revalidate cache to show updates immediately
        try {
          await revalidateVendorCache(ensuredVendor.id);
        } catch (error) {
          console.error('Error revalidating cache:', error);
        }
      }

      // finished
      setIsEditing(false);
      setCoverFile(null);
      setProfileFile(null);
    } catch (e) {
      console.error('Save profile error:', e);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header removed per request */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isViewer ? (
            <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col items-center gap-4 mb-4">
                  {effectiveUser.avatar_url ? (
                    <img src={effectiveUser.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-rose-700 text-white flex items-center justify-center text-3xl font-bold">
                  {(effectiveUser.full_name || effectiveUser.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isEditing && (
                    <input type="file" accept="image/*" onChange={e => setProfileFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="input-field" 
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input value={effectiveUser.email} readOnly className="input-field bg-gray-50" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  {isEditing ? (
                    <button disabled={saving} onClick={handleSaveViewerProfile} className="btn-primary disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="btn-secondary">
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
          // Main Content
          <div className="lg:col-span-3 space-y-6">
            {/* Vendor Profile - View/Edit FIRST */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Cover photo area */}
              {(() => {
                const cover = vendor?.portfolio_images && (vendor.portfolio_images as any)[0]
                if (cover) return <img src={cover as any} alt="Cover" className="h-28 md:h-36 w-full object-cover" />
                // Try cache by vendor id
                try {
                  const raw = localStorage.getItem(`vendor_cover_${vendor?.id}`)
                  if (raw) {
                    const parsed = JSON.parse(raw)
                    const ttlMs = 7 * 24 * 60 * 60 * 1000
                    if (parsed && Date.now() - (parsed.ts || 0) <= ttlMs && parsed.url) {
                      return <img src={parsed.url as string} alt="Cover" className="h-28 md:h-36 w-full object-cover" />
                    }
                  }
                } catch {}
                return null
              })() || (
                <div className="h-28 md:h-36 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700"></div>
              )}
              
              {/* Content */}
              <div className="p-6 pt-0">
                {/* Avatar overlaps cover */}
                <div className="-mt-10 mb-2 flex justify-center">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-20 h-20 rounded-full ring-4 ring-white object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full ring-4 ring-white bg-rose-700 text-white flex items-center justify-center text-2xl font-bold">
                      {(businessName || effectiveUser.full_name || effectiveUser.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 text-center w-full">{vendor?.business_name || businessName}</h3>
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    {/* Business types as pills */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {((vendor?.category || selectedTypes.join(', '))
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)).map(type => (
                          <span key={type} className="px-3 py-1 text-xs font-medium bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                            {type}
                          </span>
                      ))}
                      {(((vendor?.category || selectedTypes.join(', ')) || '') === '') && (
                        <span className="text-sm text-gray-500">No business types set</span>
                      )}
                    </div>

                    {/* Owner details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Owner Name</p>
                        <p className="text-sm font-medium text-gray-900">{fullName || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">WhatsApp Number</p>
                        <p className="text-sm font-medium text-gray-900">{whatsappNumber || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Owner Email</p>
                        <p className="text-sm font-medium text-gray-900">{effectiveUser.email}</p>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Website</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{websiteUrl || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Facebook</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{facebookUrl || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Instagram</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{instagramUrl || '—'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit Profile</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Image uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                        <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                        <input type="file" accept="image/*" onChange={e => setProfileFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                        <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="input-field" placeholder="Your business name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                        <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="input-field" placeholder="+91 9876543210" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input value={effectiveUser.email} readOnly className="input-field bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                        <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="input-field" placeholder="https://" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                        <input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="input-field" placeholder="https://facebook.com/yourpage" />
                      </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                        <input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} className="input-field" placeholder="https://instagram.com/yourhandle" />
                  </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Types</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CATEGORIES.filter(c => c !== 'All').map(type => (
                          <label key={type} className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleType(type)}
                              className="rounded border-gray-300 text-rose-700 focus:ring-rose-600"
                            />
                            {type}
                          </label>
                        ))}
                </div>
              </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <button disabled={saving} onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                      <button disabled={saving} onClick={handleSaveProfile} className="btn-primary disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
                  </>
                )}
            </div>
          </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Type</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">{effectiveUser.role}</p>
                  </div>
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-rose-700" />
                  </div>
                </div>
              </div>
            </div>

            

            
          </div>
          )}
        </div>
      </div>
    </div>
  );
}



