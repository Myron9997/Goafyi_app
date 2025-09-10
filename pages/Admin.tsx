import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppProvider } from '../context/AppContext';

function AdminInner() {
  const router = useRouter();
  const { state, updateVendor } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterFeatured, setFilterFeatured] = useState('All');

  // Check if user is a vendor (admin access)
  if (state.currentUser?.type !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only vendors can access the admin panel.</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const filteredVendors = state.vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || vendor.category === filterCategory;
    const matchesFeatured = filterFeatured === 'All' || 
                           (filterFeatured === 'Featured' && vendor.featured) ||
                           (filterFeatured === 'Not Featured' && !vendor.featured);

    return matchesSearch && matchesCategory && matchesFeatured;
  });

  const toggleFeatured = (vendorId: string) => {
    const vendor = state.vendors.find(v => v.id === vendorId);
    if (vendor) {
      updateVendor({ ...vendor, featured: !vendor.featured });
    }
  };

  const categories = ['All', ...Array.from(new Set(state.vendors.map(v => v.category)))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage vendors and platform content</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{state.vendors.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.vendors.filter(v => v.featured).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(state.vendors.map(v => v.category)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-semibold">📂</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.vendors.length > 0 
                    ? (state.vendors.reduce((sum, v) => sum + v.rating, 0) / state.vendors.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-semibold">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filterFeatured}
                onChange={(e) => setFilterFeatured(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Featured">Featured</option>
                <option value="Not Featured">Not Featured</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Vendors ({filteredVendors.length})
            </h3>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h4>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 bg-cover bg-center rounded-lg"
                        style={{ backgroundImage: `url('${vendor.gallery[0]}')` }}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                          {vendor.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{vendor.category} • {vendor.location}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            From ₹{vendor.startingPrice.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-500">{vendor.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/vendor/${vendor.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/vendor/${vendor.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleFeatured(vendor.id)}
                        className={`p-2 transition-colors ${
                          vendor.featured 
                            ? 'text-yellow-600 hover:text-yellow-700' 
                            : 'text-gray-400 hover:text-yellow-600'
                        }`}
                        title={vendor.featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <Star className={`w-5 h-5 ${vendor.featured ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <AppProvider>
      <AdminInner />
    </AppProvider>
  );
}






