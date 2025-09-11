"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import { VendorService } from '../../../services/vendorService';
import { RequestService } from '../../../services/requestService';
import { supabase } from '../../../lib/supabase';

export default function BookingsPage() {
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'requests' | 'pending' | 'booked'>('requests');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterRequest, setCounterRequest] = useState<any | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;
        const v = await VendorService.getVendorByUserIdCachedFirst(user.id);
        if (v?.id) setVendorId(v.id);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const loadReqs = async () => {
      if (!vendorId) return;
      try {
        const data = await RequestService.listVendorRequests(vendorId);
        console.log('Loaded requests:', data.map(r => ({ id: r.id, status: r.status })));
        setRequests(data);
      } catch (e) { console.error(e); }
    };
    loadReqs();
  }, [vendorId]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setNotifications(data || []);
        }
      } catch (e) { console.error(e); }
    };
    loadNotifications();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Bookings</h1>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Notifications</h3>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="text-xs text-blue-800 dark:text-blue-200 bg-white dark:bg-blue-900/30 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                  {notification.content}
                  <div className="text-[10px] text-blue-600 dark:text-blue-300 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {notifications.length > 3 && (
                <div className="text-[10px] text-blue-600 dark:text-blue-300">
                  +{notifications.length - 3} more notifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'requests' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'pending' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'booked' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Booked
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Pending Requests</h2>
            {loading ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : requests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-xs text-gray-500">No requests yet</div>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.status === 'pending').map((r) => (
                  <RequestRow 
                    key={r.id} 
                    req={r} 
                    onOpen={() => setSelectedReq(r)} 
                    onChanged={async () => {
                      if (!vendorId) return; 
                      const data = await RequestService.listVendorRequests(vendorId); 
                      setRequests(data);
                    }}
                    processingRequest={processingRequest}
                    setProcessingRequest={setProcessingRequest}
                    setRequests={setRequests}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Tab (accepted but unpaid) */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Pending payment</h2>
            {loading ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.status === 'accepted' || r.status === 'settled_offline').length === 0 ? (
                  <div className="text-xs text-gray-500">No pending payments</div>
                ) : (
                  requests.filter(r => r.status === 'accepted' || r.status === 'settled_offline').map((r) => (
                    <PendingRequestRow 
                      key={r.id} 
                      req={r} 
                      onChanged={async () => {
                        if (!vendorId) return; 
                        const data = await RequestService.listVendorRequests(vendorId); 
                        setRequests(data);
                      }}
                      processingRequest={processingRequest}
                      setProcessingRequest={setProcessingRequest}
                      setRequests={setRequests}
                      user={user}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Booked Tab */}
        {activeTab === 'booked' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Confirmed Bookings</h2>
            {loading ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.status === 'confirmed').length === 0 ? (
                  <div className="text-xs text-gray-500">No confirmed bookings yet</div>
                ) : (
                  requests.filter(r => r.status === 'confirmed').map((r) => (
                    <ConfirmedBookingRow key={r.id} req={r} onOpen={() => setSelectedBooking(r)} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {selectedReq && (
        <RequestDetailModal 
          req={selectedReq} 
          onClose={() => setSelectedReq(null)} 
          onChanged={async () => {
            if (!vendorId) return; 
            const data = await RequestService.listVendorRequests(vendorId); 
            setRequests(data); 
            setSelectedReq(null);
          }}
          onCounterOffer={(req) => {
            setCounterRequest(req);
            setShowCounterModal(true);
            setSelectedReq(null);
          }}
        />
      )}
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
      {showCounterModal && counterRequest && (
        <CounterOfferModal 
          request={counterRequest} 
          onClose={() => {
            setShowCounterModal(false);
            setCounterRequest(null);
          }} 
          onSuccess={async () => {
            if (!vendorId) return;
            const data = await RequestService.listVendorRequests(vendorId);
            setRequests(data);
            setShowCounterModal(false);
            setCounterRequest(null);
          }}
        />
      )}
    </div>
  );
}

function RequestRow({ req, onOpen, onChanged, processingRequest, setProcessingRequest, setRequests }: { 
  req: any; 
  onOpen: () => void; 
  onChanged: () => void;
  processingRequest: string | null;
  setProcessingRequest: (id: string | null) => void;
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const firstDate = (req.dates || []).map((d: any) => d.event_date).sort()[0];
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpen} className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user?.full_name || 'Viewer'}</div>
          <div className="text-[11px] text-gray-500">{firstDate ? `First date: ${firstDate}` : 'No date'}</div>
          {req.package && (
            <div className="text-[11px] text-gray-500 mt-0.5">Package: {req.package.title}</div>
          )}
          {req.notes && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">Notes: {req.notes}</div>
          )}
          {req.requested_changes && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">Changes: {req.requested_changes}</div>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => { 
              setProcessingRequest(req.id);
              try {
                console.log('Accepting request:', req.id, 'current status:', req.status);
                await RequestService.updateStatus(req.id, 'accepted');
                // Update the request status in the local state - no need to reload from backend
                setRequests(prev => {
                  const updated = prev.map(r => 
                    r.id === req.id ? { ...r, status: 'accepted' } : r
                  );
                  console.log('Updated requests after accept:', updated.map(r => ({ id: r.id, status: r.status })));
                  return updated;
                });
              } catch (error) {
                console.error('Error accepting request:', error);
                alert('Failed to accept request. Please try again.');
              } finally {
                setProcessingRequest(null);
              }
            }} 
            disabled={processingRequest === req.id}
            className="px-2 py-1 rounded-md text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingRequest === req.id ? 'Processing...' : 'Accept'}
          </button>
          <button 
            onClick={async () => { 
              setProcessingRequest(req.id);
              try {
                await RequestService.updateStatus(req.id, 'declined');
                // Remove declined requests from the UI - no need to reload from backend
                setRequests(prev => prev.filter(r => r.id !== req.id));
              } catch (error) {
                console.error('Error declining request:', error);
                alert('Failed to decline request. Please try again.');
              } finally {
                setProcessingRequest(null);
              }
            }} 
            disabled={processingRequest === req.id}
            className="px-2 py-1 rounded-md text-[11px] bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingRequest === req.id ? 'Processing...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingRequestRow({ req, onChanged, processingRequest, setProcessingRequest, setRequests, user }: { 
  req: any; 
  onChanged: () => void;
  processingRequest: string | null;
  setProcessingRequest: (id: string | null) => void;
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
  user: any;
}) {
  const firstDate = (req.dates || []).map((d: any) => d.event_date).sort()[0];
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user?.full_name || 'Viewer'}</div>
          <div className="text-[11px] text-gray-500">{firstDate ? `First date: ${firstDate}` : 'No date'}</div>
          {req.package && (
            <div className="text-[11px] text-gray-500 mt-0.5">Package: {req.package.title}</div>
          )}
          {req.notes && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">Notes: {req.notes}</div>
          )}
          <div className="text-[11px] text-gray-500 mt-1">
            Status: {req.status === 'settled_offline' ? 'Settled Offline' : 'Awaiting Payment'}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {req.status === 'accepted' && (
            <button 
              onClick={async () => { 
                setProcessingRequest(req.id);
                try {
                  await RequestService.updateStatus(req.id, 'confirmed');
                  onChanged();
                } finally {
                  setProcessingRequest(null);
                }
              }} 
              disabled={processingRequest === req.id}
              className="px-2 py-1 rounded-md text-[10px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingRequest === req.id ? 'Processing...' : 'Confirm Payment'}
            </button>
          )}
          {req.status === 'settled_offline' && (
            <button 
              onClick={async () => { 
                setProcessingRequest(req.id);
                // Instant UI update - move to booked tab immediately
                setRequests(prev => prev.filter(r => r.id !== req.id));
                try {
                  await RequestService.updateStatus(req.id, 'confirmed');
                  
                  // Mark related notifications as read
                  await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('receiver_id', user?.id)
                    .contains('content', 'settle payment personally');
                  
                  onChanged();
                } catch (error) {
                  console.error('Error confirming settlement:', error);
                  // Revert UI change if backend fails
                  setRequests(prev => [...prev, req]);
                  alert('Failed to confirm settlement. Please try again.');
                } finally {
                  setProcessingRequest(null);
                }
              }} 
              disabled={processingRequest === req.id}
              className="px-2 py-1 rounded-md text-[10px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingRequest === req.id ? 'Processing...' : 'Confirm Payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmedBookingRow({ req, onOpen }: { req: any; onOpen: () => void }) {
  const firstDate = (req.dates || []).map((d: any) => d.event_date).sort()[0];
  
  return (
    <div 
      onClick={onOpen}
      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user?.full_name || 'Viewer'}</div>
          <div className="text-[11px] text-gray-500">{firstDate ? `First date: ${firstDate}` : 'No date'}</div>
          {req.package && (
            <div className="text-[11px] text-gray-500 mt-0.5">Package: {req.package.title}</div>
          )}
          {req.notes && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">Notes: {req.notes}</div>
          )}
        </div>
        <div className="flex items-center">
          <span className="px-2 py-1 rounded-md text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/20">
            Confirmed
          </span>
        </div>
      </div>
    </div>
  );
}

function RequestDetailModal({ req, onClose, onChanged, onCounterOffer }: { req: any; onClose: () => void; onChanged: () => void; onCounterOffer: (req: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Request Details</h3>
          <button onClick={onClose} className="text-gray-500">×</button>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div><span className="text-gray-500">From:</span> <span className="font-medium">{req.user?.full_name || 'Viewer'}</span></div>
          <div><span className="text-gray-500">Contact:</span> {req.user?.phone || req.phone || '—'}</div>
          <div><span className="text-gray-500">Dates:</span> {(req.dates || []).map((d: any) => d.event_date).join(', ') || '—'}</div>
          <div><span className="text-gray-500">Package:</span> {req.package?.title || '—'}</div>
          {req.notes && <div><span className="text-gray-500">Notes:</span> {req.notes}</div>}
          {req.requested_changes && <div><span className="text-gray-500">Requested changes:</span> {req.requested_changes}</div>}
        </div>
        <div className="p-4 pt-0 grid grid-cols-3 gap-2">
          <button onClick={() => onCounterOffer(req)} className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Counter offer</button>
          <button onClick={async () => { await RequestService.updateStatus(req.id, 'accepted'); onChanged(); }} className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700">Accept</button>
          <button onClick={async () => { await RequestService.updateStatus(req.id, 'declined'); onChanged(); }} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700">Decline</button>
          <button onClick={async () => { await RequestService.updateStatus(req.id, 'accepted'); onChanged(); }} className="col-span-3 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">Send payment request</button>
        </div>
      </div>
    </div>
  )
}

function CounterOfferModal({ request, onClose, onSuccess }: { request: any; onClose: () => void; onSuccess: () => void }) {
  const [counterDetails, setCounterDetails] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterDetails.trim()) {
      alert('Please provide counter offer details');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await RequestService.updateStatus(
        request.id, 
        'countered', 
        counterDetails.trim(),
        counterPrice ? parseFloat(counterPrice) : undefined
      );
      onSuccess();
    } catch (error) {
      console.error('Error sending counter offer:', error);
      alert('Failed to send counter offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="relative bg-gradient-to-r from-orange-600 to-red-600 p-4 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <span className="text-lg">×</span>
          </button>
          <h3 className="text-lg font-bold">Counter Offer</h3>
          <p className="text-orange-100 text-sm mt-1">For {request.user?.full_name || 'Viewer'}</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Original Request</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Package: {request.package?.title || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Dates: {request.dates?.map((d: any) => d.event_date).join(', ') || 'N/A'}
            </p>
            {request.requested_changes && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Requested Changes: {request.requested_changes}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Counter Offer Details *
              </label>
              <textarea
                value={counterDetails}
                onChange={(e) => setCounterDetails(e.target.value)}
                placeholder="Describe your counter offer, changes to the package, pricing adjustments, etc."
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Price (Optional)
              </label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder="Enter new price if different"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !counterDetails.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Counter Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Booking Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">×</button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{booking.user?.full_name || 'Viewer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Contact:</span>
            <span className="text-gray-900 dark:text-gray-100">{booking.user?.phone || booking.phone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-900 dark:text-gray-100">{booking.user?.email || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Event Dates:</span>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {(booking.dates || []).map((d: any) => d.event_date).join(', ') || '—'}
            </div>
          </div>
          {booking.package && (
            <div className="flex justify-between">
              <span className="text-gray-500">Package:</span>
              <span className="text-gray-900 dark:text-gray-100">{booking.package.title}</span>
            </div>
          )}
          {booking.package && (
            <div className="flex justify-between">
              <span className="text-gray-500">Price:</span>
              <span className="text-gray-900 dark:text-gray-100">
                ₹{booking.package.price}
                {booking.package.pricing_type === 'per_person' && ' per person'}
              </span>
            </div>
          )}
          {booking.counter_offer_price && (
            <div className="flex justify-between">
              <span className="text-gray-500">Final Price:</span>
              <span className="font-medium text-green-600">₹{booking.counter_offer_price}</span>
            </div>
          )}
          {booking.notes && (
            <div>
              <span className="text-gray-500">Notes:</span>
              <div className="mt-1 text-gray-900 dark:text-gray-100">{booking.notes}</div>
            </div>
          )}
          {booking.requested_changes && (
            <div>
              <span className="text-gray-500">Requested Changes:</span>
              <div className="mt-1 text-gray-900 dark:text-gray-100">{booking.requested_changes}</div>
            </div>
          )}
          {booking.counter_offer_details && (
            <div>
              <span className="text-gray-500">Counter Offer Details:</span>
              <div className="mt-1 text-gray-900 dark:text-gray-100">{booking.counter_offer_details}</div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span className="px-2 py-1 rounded-md text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/20">
              Confirmed
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confirmed:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {new Date(booking.updated_at).toLocaleDateString()}
            </span>
          </div>
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
