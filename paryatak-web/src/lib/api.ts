import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_URL });

// Attach token for browser requests
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('paryatak_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

// ─── Destinations ─────────────────────────────────────────────────────────────
export const getDestinations = (params?: Record<string, unknown>) => api.get('/destinations', { params });
export const getFeaturedDestinations = () => api.get('/destinations/featured');
export const getDestinationBySlug = (slug: string) => api.get(`/destinations/${slug}`);
export const getDestinationReviews = (id: string, params?: Record<string, unknown>) => api.get(`/destinations/${id}/reviews`, { params });
export const getNearbyDestinations = (lat: number, lng: number, radius = 50) => api.get('/destinations/nearby', { params: { lat, lng, radius } });

// ─── States ───────────────────────────────────────────────────────────────────
export const getStates = () => api.get('/states');
export const getState = (slug: string) => api.get(`/states/${slug}`);
export const getStateDestinations = (slug: string, params?: Record<string, unknown>) => api.get(`/states/${slug}/destinations`, { params });

// ─── Categories ───────────────────────────────────────────────────────────────
export const getCategories = () => api.get('/categories');
export const getCategoryDestinations = (slug: string, params?: Record<string, unknown>) => api.get(`/categories/${slug}/destinations`, { params });

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchDestinations = (params: Record<string, unknown>) => api.get('/search', { params });

// ─── Trips ────────────────────────────────────────────────────────────────────
export const getTrips = (params?: Record<string, unknown>) => api.get('/trips', { params });
export const getTrip = (id: string) => api.get(`/trips/${id}`);
export const createTrip = (data: Record<string, unknown>) => api.post('/trips', data);
export const updateTrip = (id: string, data: Record<string, unknown>) => api.put(`/trips/${id}`, data);
export const deleteTrip = (id: string) => api.delete(`/trips/${id}`);
export const addToTrip = (tripId: string, data: Record<string, unknown>) => api.post(`/trips/${tripId}/destinations`, data);
export const removeFromTrip = (tripId: string, destId: string) => api.delete(`/trips/${tripId}/destinations/${destId}`);
export const updateItinerary = (tripId: string, items: unknown[]) => api.put(`/trips/${tripId}/itinerary`, { items });

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const createReview = (data: Record<string, unknown>) => api.post('/reviews', data);
export const updateReview = (id: string, data: Record<string, unknown>) => api.put(`/reviews/${id}`, data);
export const deleteReview = (id: string) => api.delete(`/reviews/${id}`);

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export const getBookmarks = () => api.get('/bookmarks');
export const addBookmark = (destinationId: string) => api.post('/bookmarks', { destinationId });
export const removeBookmark = (destinationId: string) => api.delete(`/bookmarks/${destinationId}`);

// ─── History ──────────────────────────────────────────────────────────────────
export const getHistory = (params?: Record<string, unknown>) => api.get('/history', { params });
export const addHistory = (data: Record<string, unknown>) => api.post('/history', data);

// ─── Maps ─────────────────────────────────────────────────────────────────────
export const getDestinationsGeoJSON = () => api.get('/maps/destinations');
export const getNearbyServices = (params: Record<string, unknown>) => api.get('/maps/nearby-services', { params });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me');
export const updateMe = (data: Record<string, unknown>) => api.put('/auth/me', data);
