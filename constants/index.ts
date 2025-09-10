export const CATEGORIES = [
  'All',
  'Wedding Planner',
  'Emcee',
  'Decorator',
  'Photographer',
  'Cameraman',
  'Catering',
  'Venue',
  'Band',
  'Solo Artist',
  'DJ',
  'Florist',
  'Makeup Artist',
  'Suit Designer',
  'Gown Designer',
  'Bridesmaid Dresses',
  'Best Man Suits',
  'Accessories',
  'Bar Services'
] as const;

export const LOCATIONS = [
  'All Locations',
  'Panaji',
  'Margao',
  'Vasco da Gama',
  'Mapusa',
  'Ponda',
  'Baga',
  'Calangute',
  'Anjuna',
  'Candolim',
  'Arambol',
  'Palolem',
  'Agonda',
  'Colva',
  'Benaulim'
] as const;

export const ROUTES = {
  HOME: '/',
  VENDOR_PROFILE: '/vendor/:id',
  VENDOR_SIGNUP: '/signup',
  VENDOR_LOGIN: '/vendor-login',
  VIEWER_LOGIN: '/viewer-login',
  ACCOUNT: '/account',
  MESSAGES: '/messages',
  SAVED: '/saved',
  ADMIN: '/admin',
  SEARCH: '/search',
  NOT_FOUND: '/404'
} as const;

export const API_ENDPOINTS = {
  VENDORS: '/api/vendors',
  USERS: '/api/users',
  BOOKINGS: '/api/bookings',
  MESSAGES: '/api/messages',
  AUTH: '/api/auth',
  UPLOAD: '/api/upload'
} as const;

export const USER_TYPES = {
  VENDOR: 'vendor',
  VIEWER: 'viewer'
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BOOKING_REQUEST: 'booking_request'
} as const;

