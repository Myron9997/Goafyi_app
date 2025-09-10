"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Vendor, Booking } from '../types';

interface AppState {
  currentUser: User | null;
  vendors: Vendor[];
  savedVendors: string[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_VENDORS'; payload: Vendor[] }
  | { type: 'ADD_VENDOR'; payload: Vendor }
  | { type: 'UPDATE_VENDOR'; payload: Vendor }
  | { type: 'TOGGLE_SAVED_VENDOR'; payload: string }
  | { type: 'SET_BOOKINGS'; payload: Booking[] }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: AppState = {
  currentUser: null,
  vendors: [],
  savedVendors: [],
  bookings: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_VENDORS':
      return { ...state, vendors: action.payload };
    case 'ADD_VENDOR':
      return { ...state, vendors: [action.payload, ...state.vendors] };
    case 'UPDATE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.map(v => 
          v.id === action.payload.id ? action.payload : v
        ),
      };
    case 'TOGGLE_SAVED_VENDOR':
      return {
        ...state,
        savedVendors: state.savedVendors.includes(action.payload)
          ? state.savedVendors.filter(id => id !== action.payload)
          : [...state.savedVendors, action.payload],
      };
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload };
    case 'ADD_BOOKING':
      return { ...state, bookings: [action.payload, ...state.bookings] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  toggleSavedVendor: (vendorId: string) => void;
  addBooking: (booking: Booking) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved vendors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedVendors');
    if (saved) {
      try {
        const savedArray = JSON.parse(saved);
        savedArray.forEach((id: string) => {
          dispatch({ type: 'TOGGLE_SAVED_VENDOR', payload: id });
        });
      } catch (error) {
        console.error('Error loading saved vendors:', error);
      }
    }
  }, []);

  // Save to localStorage when savedVendors changes
  useEffect(() => {
    localStorage.setItem('savedVendors', JSON.stringify(state.savedVendors));
  }, [state.savedVendors]);

  const login = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
    localStorage.removeItem('currentUser');
  };

  const addVendor = (vendor: Vendor) => {
    dispatch({ type: 'ADD_VENDOR', payload: vendor });
  };

  const updateVendor = (vendor: Vendor) => {
    dispatch({ type: 'UPDATE_VENDOR', payload: vendor });
  };

  const toggleSavedVendor = (vendorId: string) => {
    dispatch({ type: 'TOGGLE_SAVED_VENDOR', payload: vendorId });
  };

  const addBooking = (booking: Booking) => {
    dispatch({ type: 'ADD_BOOKING', payload: booking });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    addVendor,
    updateVendor,
    toggleSavedVendor,
    addBooking,
    setLoading,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

