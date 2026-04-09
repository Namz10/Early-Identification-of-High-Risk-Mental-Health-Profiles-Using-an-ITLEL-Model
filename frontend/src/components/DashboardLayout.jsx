import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Simple breadcrumb logic
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-primary"></div>
            </div>
            <span className="font-bold text-primary tracking-tight">MindScreen</span>
          </div>
        </div>

        <nav className="flex-grow px-4 space-y-1">
          <NavLink 
            to="/dashboard/patients" 
            className={({ isActive }) => `
              flex items-center px-4 py-2.5 text-sm font-medium rounded-sm transition-colors
              ${isActive ? 'bg-slate-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Patient Roster
          </NavLink>
          <NavLink 
            to="/dashboard/analytics" 
            className={({ isActive }) => `
              flex items-center px-4 py-2.5 text-sm font-medium rounded-sm transition-colors
              ${isActive ? 'bg-slate-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 01-2 2h-2a2 2 0 01-2-2m7-11a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Population Overview
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {user?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">Clinician</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest leading-none mt-1">Specialist</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center text-xs font-medium text-slate-400 uppercase tracking-widest">
            <span>Dashboard</span>
            {pathnames.slice(1).map((name, index) => (
              <React.Fragment key={index}>
                <span className="mx-2 text-slate-300">/</span>
                <span className={index === pathnames.length - 2 ? 'text-primary' : ''}>
                  {name.replace(/-/g, ' ')}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h2 className="text-xl font-light text-slate-800 tracking-tight">
            {title}
          </h2>
        </header>

        {/* Scrollable Content */}
        <main className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
