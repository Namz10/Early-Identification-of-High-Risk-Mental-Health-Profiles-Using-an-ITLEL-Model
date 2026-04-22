import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PHQ9_QUESTIONS, RESPONSE_OPTIONS } from '../assets/phq9';
import api from '../services/api';

const AssessmentFlow = () => {
  const [currentStep, setCurrentStep] = useState(-1); // Start at -1 for the name step
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [responses, setResponses] = useState(Array(9).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleOptionSelect = (value) => {
    const newResponses = [...responses];
    newResponses[currentStep] = value;
    setResponses(newResponses);
  };

  const handleNext = async () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      alert("Please enter a name for the assessment.");
      setCurrentStep(-1);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/assessments/submit', { 
        patient_name: patientName,
        date_of_birth: dob,
        responses 
      });
      const { assessment_id } = response.data;
      navigate('/confirmation', { state: { assessment_id } });
    } catch (err) {
      console.error('Submission failed', err);
      alert('Failed to submit assessment. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center uppercase tracking-widest">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-6"></div>
        <p className="text-lg font-light text-slate-800">
          Analysing your responses…
        </p>
      </div>
    );
  }

  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / 9) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="w-full h-1 bg-slate-100">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col px-6 py-12 md:py-24">
        {currentStep === -1 ? (
          /* Step 0: Patient Identification */
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-light text-slate-800 mb-8 leading-tight">
              Welcome to MindScreen. <br/>
              <span className="text-slate-400">Who are we assessing today?</span>
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Patient's Full Name
                </label>
                <input 
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border-b-2 border-slate-100 py-4 text-2xl font-light focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Date of Birth (Optional)
                </label>
                <input 
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="e.g. 15th Aug 1995"
                  className="w-full border-b-2 border-slate-100 py-2 text-xl font-light focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <p className="text-slate-400 text-sm italic">
                This information will be used to identify the assessment in the clinician dashboard and report.
              </p>
            </div>
          </div>
        ) : (
          /* Step 1-9: PHQ-9 Questions */
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Question {currentStep + 1} of 9
            </p>

            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-light text-slate-800 leading-relaxed">
                {currentStep === 0 && (
                  <span className="block text-sm font-medium text-slate-400 mb-4 tracking-tight">
                    Over the past two weeks, how often have you had...
                  </span>
                )}
                {PHQ9_QUESTIONS[currentStep]}?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
              {RESPONSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`
                    p-6 text-left border border-slate-200 transition-all
                    ${responses[currentStep] === option.value 
                      ? 'border-primary bg-slate-50' 
                      : 'hover:border-slate-300'
                    }
                  `}
                >
                  <span className="text-sm font-medium text-slate-800">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-auto pt-8 border-t border-slate-100">
          <button
            onClick={handlePrevious}
            disabled={currentStep === -1}
            className={`
              text-xs font-semibold uppercase tracking-widest flex items-center
              ${currentStep === -1 ? 'text-slate-100' : 'text-slate-400 hover:text-primary'}
            `}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === -1 ? !patientName.trim() : responses[currentStep] === null}
            className={`
              px-10 py-3 text-sm font-medium transition-all
              ${(currentStep === -1 ? !patientName.trim() : responses[currentStep] === null)
                ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-opacity-90'
              }
            `}
          >
            {currentStep === 8 ? 'Complete Assessment' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentFlow;
