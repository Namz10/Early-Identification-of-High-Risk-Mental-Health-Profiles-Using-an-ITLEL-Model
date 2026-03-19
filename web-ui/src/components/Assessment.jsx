import { useState, useCallback } from 'react';
import { questions, options } from '../data/questions';

export default function Assessment({ answers, setAnswers, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [animDir, setAnimDir] = useState('enter');
  const [showValidation, setShowValidation] = useState(false);

  const progress = ((currentQ + 1) / questions.length) * 100;
  const question = questions[currentQ];
  const selectedValue = answers[currentQ];

  const selectOption = useCallback(
    (value) => {
      const next = [...answers];
      next[currentQ] = value;
      setAnswers(next);
      setShowValidation(false);
    },
    [answers, currentQ, setAnswers]
  );

  const goNext = () => {
    if (selectedValue === null || selectedValue === undefined) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);

    if (currentQ < questions.length - 1) {
      setAnimDir('exit');
      setTimeout(() => {
        setCurrentQ((q) => q + 1);
        setAnimDir('enter');
      }, 250);
    } else {
      onComplete();
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setShowValidation(false);
      setAnimDir('exit');
      setTimeout(() => {
        setCurrentQ((q) => q - 1);
        setAnimDir('enter');
      }, 250);
    }
  };

  const isLast = currentQ === questions.length - 1;

  return (
    <div className="assessment" role="main" aria-label="Assessment questionnaire">
      {/* Progress */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-count">
            Question {currentQ + 1} of {questions.length}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={currentQ + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-label={`Question ${currentQ + 1} of ${questions.length}`}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div
        className={`question-card question-${animDir}`}
        key={currentQ}
      >
        <p className="question-number">Question {currentQ + 1}</p>
        <h2 className="question-text" id={`question-${currentQ}`}>
          {question.text}
        </h2>
        <p className="question-subtext">{question.subtext}</p>

        <div
          className="options-list"
          role="radiogroup"
          aria-labelledby={`question-${currentQ}`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn${selectedValue === opt.value ? ' selected' : ''}`}
              onClick={() => selectOption(opt.value)}
              role="radio"
              aria-checked={selectedValue === opt.value}
              aria-label={opt.label}
              id={`option-${currentQ}-${opt.value}`}
            >
              <span className="option-radio" aria-hidden="true">
                <span className="option-radio-dot" />
              </span>
              <span className="option-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showValidation && (
        <p className="validation-hint" role="alert">
          Please select an option before continuing.
        </p>
      )}

      {/* Navigation */}
      <div className="nav-buttons">
        {currentQ > 0 ? (
          <button
            className="btn btn-ghost"
            onClick={goPrev}
            aria-label="Go to previous question"
            id="prev-btn"
          >
            <span className="btn-icon" aria-hidden="true">←</span>
            Previous
          </button>
        ) : (
          <div className="nav-spacer" />
        )}

        <button
          className="btn btn-primary"
          onClick={goNext}
          aria-label={isLast ? 'Submit assessment' : 'Go to next question'}
          id="next-btn"
        >
          {isLast ? 'View Results' : 'Next'}
          <span className="btn-icon" aria-hidden="true">
            {isLast ? '✓' : '→'}
          </span>
        </button>
      </div>
    </div>
  );
}
