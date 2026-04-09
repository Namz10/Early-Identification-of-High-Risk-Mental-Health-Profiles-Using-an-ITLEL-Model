import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    user: null,
    role: localStorage.getItem('role'),
    loading: true,
  });

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            logout();
          } else {
            setAuth({
              token,
              user: decoded.sub,
              role: decoded.role,
              loading: false,
            });
          }
        } catch (error) {
          logout();
        }
      } else {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    const decoded = jwtDecode(token);
    setAuth({
      token,
      user: decoded.sub,
      role: role,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({
      token: null,
      user: null,
      role: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
