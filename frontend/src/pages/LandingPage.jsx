import React, { useState } from 'react';
import LoginModal from '../components/LoginModal';

const LandingPage = () => {
  const [loginRole, setLoginRole] = useState(null);

  const openLogin = (role) => setLoginRole(role);
  const closeLogin = () => setLoginRole(null);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Top Bar */}
      <nav className="border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <span className="text-primary font-bold text-lg tracking-tight">
          MindScreen Clinical Platform
        </span>
        <div className="w-8 h-8 border-2 border-primary rounded-sm flex items-center justify-center">
          <div className="w-4 h-4 bg-primary"></div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4">
        <div className="max-w-4xl text-center mb-16">
          <h1 className="text-4xl font-light text-slate-800 mb-4">
            Early identification of high-risk mental health profiles
          </h1>
          <div className="h-1 w-20 bg-primary mx-auto"></div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
          {/* Patient Card */}
          <div className="border border-slate-200 p-8 flex flex-col items-center text-center hover:border-primary transition-colors cursor-default">
            <svg className="w-12 h-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 className="text-xl font-medium mb-2">Patient Self-Assessment</h2>
            <p className="text-slate-500 text-sm mb-6">Standardized clinical questionnaire for baseline mental health screening.</p>
            <button 
              onClick={() => openLogin('patient')}
              className="bg-primary text-white px-8 py-2 text-sm font-medium hover:bg-opacity-90 transition-opacity"
            >
              Start Assessment
            </button>
          </div>

          {/* Clinician Card */}
          <div className="border border-slate-200 p-8 flex flex-col items-center text-center hover:border-primary transition-colors cursor-default">
            <svg className="w-12 h-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-xl font-medium mb-2">Clinical Specialist Portal</h2>
            <p className="text-slate-500 text-sm mb-6">Patient monitoring, risk visualization, and clinical report generation.</p>
            <button 
              onClick={() => openLogin('clinician')}
              className="bg-primary text-white px-8 py-2 text-sm font-medium hover:bg-opacity-90 transition-opacity"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-widest">
          For clinical use only. This tool does not constitute a diagnosis.
        </p>
      </footer>

      {/* Login Modal */}
      {loginRole && (
        <LoginModal role={loginRole} onClose={closeLogin} />
      )}
    </div>
  );
};

export default LandingPage;
