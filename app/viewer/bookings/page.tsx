"use client";

import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import { RequestService } from '../../../services/requestService';

export default function ViewerBookingsPage() {
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'requests' | 'confirmed'>('requests');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;
        const data = await RequestService.listViewerRequests(user.id);
        setRequests(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">My bookings</h1>

        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setActiveTab('requests')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'requests' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>Requests received</button>
          <button onClick={() => setActiveTab('confirmed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${activeTab === 'confirmed' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>Booking confirmed</button>
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Requests sent back</h2>
            {loading ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : requests.filter(r => r.status === 'accepted' || r.status === 'countered').length === 0 ? (
              <div className="text-xs text-gray-500">No requests yet</div>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.status === 'accepted' || r.status === 'countered').map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.vendor?.business_name || 'Vendor'}</div>
                        <div className="text-[11px] text-gray-500">Dates: {(r.dates || []).map((d: any) => d.event_date).join(', ') || '—'}</div>
                        <div className="text-[11px] text-gray-500">Status: {r.status === 'countered' ? 'Counter Offer' : 'Accepted'}</div>
                        {r.package && (
                          <div className="text-[11px] text-gray-500">Package: {r.package.title}</div>
                        )}
                        {r.counter_offer_price && (
                          <div className="text-[11px] text-orange-600 font-medium">New Price: ₹{r.counter_offer_price}</div>
                        )}
                        {r.counter_offer_details && (
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                            <strong>Counter Offer:</strong> {r.counter_offer_details}
                          </div>
                        )}
                      </div>
                      {(r.status === 'accepted' || r.status === 'countered') && (
                        <div className="flex flex-col gap-1">
                          <button onClick={() => { setSelectedRequest(r); setShowPaymentModal(true); }} className="px-2 py-1 rounded-md text-[10px] bg-blue-600 text-white hover:bg-blue-700">Make Payment</button>
                          <button 
                            onClick={async () => {
                              setProcessingRequest(r.id);
                              // Instant UI update - remove from requests immediately
                              setRequests(prev => prev.filter(req => req.id !== r.id));
                              try {
                                await RequestService.updateStatus(r.id, 'settled_offline');
                              } catch (error) {
                                console.error('Error updating status:', error);
                                // Revert UI change if backend fails
                                setRequests(prev => [...prev, r]);
                                alert('Failed to update status. Please try again.');
                              } finally {
                                setProcessingRequest(null);
                              }
                            }}
                            disabled={processingRequest === r.id}
                            className="px-2 py-1 rounded-md text-[10px] bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingRequest === r.id ? 'Processing...' : 'Sort out personally'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'confirmed' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Confirmed bookings</h2>
            {loading ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.status === 'confirmed').length === 0 ? (
                  <div className="text-xs text-gray-500">No confirmed bookings yet</div>
                ) : (
                  requests.filter(r => r.status === 'confirmed').map((r) => (
                    <div 
                      key={r.id} 
                      onClick={() => setSelectedBooking(r)}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.vendor?.business_name || 'Vendor'}</div>
                          <div className="text-[11px] text-gray-500">Dates: {(r.dates || []).map((d: any) => d.event_date).join(', ') || '—'}</div>
                          {r.package && (
                            <div className="text-[11px] text-gray-500">Package: {r.package.title}</div>
                          )}
                          <div className="text-[11px] text-gray-500">Status: Confirmed</div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-md text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/20">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {showPaymentModal && selectedRequest && (
        <PaymentModal request={selectedRequest} onClose={() => { setShowPaymentModal(false); setSelectedRequest(null); }} />
      )}
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
    </div>
  );
}

function PaymentModal({ request, onClose }: { request: any; onClose: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState<'visa' | 'upi' | 'cash' | null>(null);

  const handlePayment = async (method: 'visa' | 'upi' | 'cash') => {
    if (method === 'cash') {
      alert('Call vendor to arrange cash payment');
    } else {
      alert(`${method.toUpperCase()} payment integration coming soon`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <span className="text-lg">×</span>
          </button>
          <h3 className="text-lg font-bold">Payment Options</h3>
          <p className="text-blue-100 text-sm mt-1">{request.vendor?.business_name || 'Vendor'}</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Package: {request.package?.title || 'N/A'}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Dates: {request.dates?.map((d: any) => d.event_date).join(', ') || 'N/A'}
            </p>
            {request.counter_offer_price && (
              <p className="text-sm text-orange-600 font-medium">
                New Price: ₹{request.counter_offer_price}
              </p>
            )}
            {request.counter_offer_details && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Counter Offer:</strong> {request.counter_offer_details}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Choose Payment Method:</h4>
            
            <button
              onClick={() => handlePayment('visa')}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Visa Card</div>
                  <div className="text-xs text-gray-500">Credit/Debit Card</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePayment('upi')}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">U</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">UPI</div>
                  <div className="text-xs text-gray-500">PhonePe, GPay, Paytm</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePayment('cash')}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">₹</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Cash Payment</div>
                  <div className="text-xs text-gray-500">Call vendor to arrange</div>
                </div>
              </div>
            </button>
          </div>
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
            <span className="text-gray-500">Vendor:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{booking.vendor?.business_name || 'Vendor'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Contact:</span>
            <span className="text-gray-900 dark:text-gray-100">{booking.vendor?.contact_phone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-900 dark:text-gray-100">{booking.vendor?.contact_email || '—'}</span>
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


