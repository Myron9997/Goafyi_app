export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  startingPrice: number;
  rating: number;
  featured: boolean;
  gallery: string[];
  packages: Package[];
  description: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  availability?: {
    isAvailable: boolean;
    nextAvailableDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  features: string[];
  description?: string;
  duration?: string;
  includes?: string[];
}

export interface User {
  id: string;
  name: string;
  type: 'vendor' | 'viewer';
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  vendorId: string;
  userId: string;
  packageId?: string;
  date: string;
  guests?: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'booking_request';
  createdAt: string;
  read: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  availability?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

