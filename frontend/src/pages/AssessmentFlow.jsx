import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PHQ9_QUESTIONS, RESPONSE_OPTIONS } from '../assets/phq9';
import api from '../services/api';

const AssessmentFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/assessments/submit', { responses });
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-6"></div>
        <p className="text-lg font-light text-slate-800 uppercase tracking-widest">
          Analysing your responses…
        </p>
      </div>
    );
  }

  const progress = ((currentStep + 1) / 9) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Progress Bar Container */}
      <div className="w-full h-1 bg-slate-100">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col px-6 py-12 md:py-24">
        {/* Step Indicator */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Question {currentStep + 1} of 9
        </p>

        {/* Question Text */}
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

        {/* Options Grid */}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-auto pt-8 border-t border-slate-100">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`
              text-xs font-semibold uppercase tracking-widest flex items-center
              ${currentStep === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-primary'}
            `}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={responses[currentStep] === null}
            className={`
              px-10 py-3 text-sm font-medium transition-all
              ${responses[currentStep] === null 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-opacity-90'
              }
            `}
          >
            {currentStep === 8 ? 'Complete Assessment' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentFlow;
