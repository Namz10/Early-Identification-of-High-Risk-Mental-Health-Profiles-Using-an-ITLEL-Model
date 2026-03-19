export default function LandingPage({ onStart }) {
  return (
    <div className="landing" role="main">
      <div className="landing-icon" aria-hidden="true">
        🧠
      </div>

      <p className="landing-subtitle">ITLEL Model Assessment</p>

      <h1>Mental Health Risk Screening</h1>

      <p className="landing-description">
        A quick, confidential screening based on the PHQ-9 questionnaire to help
        identify early signs of mental health concerns. Your well-being matters.
      </p>

      <div className="landing-features">
        <div className="feature-chip">
          <span className="feature-chip-icon" aria-hidden="true">⏱️</span>
          <span>2–3 minutes</span>
        </div>
        <div className="feature-chip">
          <span className="feature-chip-icon" aria-hidden="true">📋</span>
          <span>9 questions</span>
        </div>
        <div className="feature-chip">
          <span className="feature-chip-icon" aria-hidden="true">🔒</span>
          <span>Private & Secure</span>
        </div>
      </div>

      <p className="landing-note">
        <strong>Note:</strong> This screening tool is for educational purposes
        only and does not replace professional medical advice, diagnosis, or
        treatment.
      </p>

      <button
        className="btn btn-primary"
        onClick={onStart}
        id="start-assessment-btn"
        aria-label="Start the mental health assessment"
      >
        <span className="btn-icon" aria-hidden="true">✨</span>
        Start Assessment
      </button>
    </div>
  );
}
