import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const response = await authAPI.verify();
        if (response.data.valid) {
          setAdmin(response.data.admin);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password });
    const { token, admin } = response.data;
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(admin));
    setAdmin(admin);
    return admin;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  const value = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated: !!admin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
