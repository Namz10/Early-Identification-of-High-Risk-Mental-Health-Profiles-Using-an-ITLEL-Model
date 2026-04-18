import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: localStorage.getItem('user'),
    role: localStorage.getItem('role'),
    loading: false,
  });

  const login = (userData) => {
    localStorage.setItem('token', userData.access_token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('user', userData.full_name || userData.email);
    
    setAuth({
      user: userData.full_name || userData.email,
      role: userData.role,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setAuth({
      user: null,
      role: null,
      loading: false,
    });
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
