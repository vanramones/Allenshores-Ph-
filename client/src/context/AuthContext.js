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
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const adminToken = localStorage.getItem('adminToken');
    const ownerToken = localStorage.getItem('ownerToken');

    if (ownerToken) {
      try {
        // Verify owner token by decoding it client-side (server verify returns generic admin)
        const payload = JSON.parse(atob(ownerToken.split('.')[1]));
        if (payload.role === 'owner' && payload.exp * 1000 > Date.now()) {
          setOwner({
            id: payload.id,
            username: payload.username,
            beach_id: payload.beach_id,
            role: 'owner'
          });
        } else {
          localStorage.removeItem('ownerToken');
        }
      } catch (error) {
        localStorage.removeItem('ownerToken');
      }
    } else if (adminToken) {
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

  const ownerLogin = async (username, password) => {
    const response = await authAPI.ownerLogin({ username, password });
    const { token, owner } = response.data;
    localStorage.setItem('ownerToken', token);
    localStorage.setItem('ownerUser', JSON.stringify(owner));
    setOwner(owner);
    return owner;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    setAdmin(null);
    setOwner(null);
  };

  const value = {
    admin,
    owner,
    loading,
    login,
    ownerLogin,
    logout,
    isAuthenticated: !!admin || !!owner,
    isAdmin: !!admin,
    isOwner: !!owner,
    beachId: owner?.beach_id || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
