import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';

const Confirmation = () => {
  const location = useLocation();
  const assessment_id = location.state?.assessment_id;

  if (!assessment_id) {
    return <Navigate to="/" replace />;
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const referenceId = `MSC-${dateStr}-${assessment_id}`;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full border border-slate-200 p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-light text-slate-800 mb-4">
          Submission Successful
        </h2>
        
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Your responses have been processed. A qualified mental health specialist will review your assessment.
        </p>

        <div className="bg-slate-50 w-full p-4 mb-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
            Reference Identifier
          </p>
          <p className="text-primary font-mono text-sm tracking-wider">
            {referenceId}
          </p>
        </div>

        <p className="text-slate-400 text-xs italic mb-12">
          You may safely close this window or return to the main portal.
        </p>

        <Link 
          to="/" 
          className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
        >
          Return to Portal
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
