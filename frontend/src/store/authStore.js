import { create } from 'zustand';
import api from '../api/axios';

// Initialize state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
  };
};

const useAuthStore = create((set) => ({
  ...getInitialState(),
  
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, ...userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ 
        user: userData, 
        token, 
        isAuthenticated: true 
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  register: async (name, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token, ...userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ 
        user: userData, 
        token, 
        isAuthenticated: true 
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => {
    set({ user: userData });
    localStorage.setItem('user', JSON.stringify(userData));
  },
}));

export default useAuthStore;
