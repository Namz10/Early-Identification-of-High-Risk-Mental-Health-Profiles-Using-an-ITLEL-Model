import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginModal = ({ role, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role: userRole } = response.data;

      if (userRole !== role) {
        setError(`Access denied: This login is for ${role}s only.`);
        setLoading(false);
        return;
      }

      login(access_token, userRole);
      
      if (userRole === 'patient') {
        navigate('/assessment');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 max-w-md w-full border border-slate-200 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-light text-slate-800 uppercase tracking-tight">
            {role} Access
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. clinic@mindscreen.org"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="text-red-600 text-xs px-1">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-3 text-sm font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs italic">
            Forgot credentials? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
