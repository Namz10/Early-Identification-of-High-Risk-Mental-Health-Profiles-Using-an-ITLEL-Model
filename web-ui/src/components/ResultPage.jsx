import { useState, useEffect } from 'react';
import { getRiskLevel } from '../data/questions';

const API_URL = 'http://localhost:8000';

export default function ResultPage({ answers, onRetake }) {
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Fallback local scoring
  const totalScore = answers.reduce((sum, val) => sum + (val ?? 0), 0);
  const maxScore = 27;
  const localRisk = getRiskLevel(totalScore);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`${API_URL}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setApiResult(data);
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [answers]);

  // Use API result if available, otherwise fall back to local
  const useApi = apiResult && !apiError;
  const severity = useApi ? apiResult.predicted_severity : localRisk.label;
  const riskScore = useApi ? apiResult.risk_score : totalScore / maxScore;
  const riskCategory = useApi ? apiResult.risk_category : localRisk.label;
  const modelUsed = useApi ? apiResult.model_used : false;
  const risk = localRisk; // for colors/suggestions

  const percentage = Math.round(riskScore * 100);

  return (
    <div className="result" role="main" aria-label="Assessment results">
      {/* Loading state */}
      {loading && (
        <div className="result-loading">
          <div className="spinner" aria-label="Analyzing your responses" />
          <p className="result-loading-text">Analyzing your responses...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Model badge */}
          <div className="model-badge-bar">
            {modelUsed ? (
              <span className="model-badge model-badge--real">
                ✅ ITLEL Ensemble Model
              </span>
            ) : (
              <span className="model-badge model-badge--fallback">
                ⚠️ Fallback Scoring {apiError ? '(API unavailable)' : '(model not trained)'}
              </span>
            )}
          </div>

          {/* Main Result Card */}
          <div className="result-card">
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: `linear-gradient(90deg, ${risk.color}, ${risk.color}88)`,
              }}
            />
            <div className="result-header">
              <p className="result-title">Your Assessment Result</p>
              <div
                className="result-badge"
                style={{ background: risk.bgColor, color: risk.color }}
              >
                <span className="result-badge-emoji" aria-hidden="true">
                  {risk.emoji}
                </span>
                {severity}
              </div>
            </div>

            {/* Risk category */}
            {useApi && (
              <p className="risk-category-label">
                Risk Category: <strong>{riskCategory}</strong>
              </p>
            )}

            {/* Score bar */}
            <div className="result-score-section">
              <p className="result-score-label">
                {modelUsed ? 'Model Risk Score' : 'PHQ-9 Score'}
              </p>
              <div className="result-score-bar">
                <div
                  className="result-score-fill"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${risk.color}, ${risk.color}AA)`,
                  }}
                />
              </div>
              <p className="result-score-value">
                {modelUsed
                  ? `${(riskScore * 100).toFixed(1)}%`
                  : `${totalScore} out of ${maxScore}`}
              </p>
            </div>

            <p className="result-description">{risk.description}</p>
          </div>

          {/* Severity Probabilities */}
          {useApi && apiResult.probabilities && (
            <div className="explainer-card">
              <h2 className="explainer-title">
                <span aria-hidden="true">📊</span> Severity Probabilities
              </h2>
              <div className="prob-bars">
                {Object.entries(apiResult.probabilities).map(([label, prob]) => (
                  <div key={label} className="prob-row">
                    <span className="prob-label">{label}</span>
                    <div className="prob-track">
                      <div
                        className="prob-fill"
                        style={{ width: `${Math.round(prob * 100)}%` }}
                      />
                    </div>
                    <span className="prob-val">{(prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHAP Values */}
          {useApi && apiResult.shap_values && (
            <div className="explainer-card">
              <h2 className="explainer-title">
                <span aria-hidden="true">🔍</span> SHAP Feature Importance
              </h2>
              <p className="explainer-desc">
                Shows how much each question influenced your risk score.
                Positive values increase risk; negative values decrease it.
              </p>
              <div className="shap-bars">
                {Object.entries(apiResult.shap_values)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .map(([feature, value]) => {
                    const maxVal = Math.max(
                      ...Object.values(apiResult.shap_values).map(Math.abs)
                    );
                    const pct = maxVal ? Math.abs(value) / maxVal * 100 : 0;
                    const isPositive = value >= 0;
                    return (
                      <div key={feature} className="shap-row">
                        <span className="shap-label">{feature}</span>
                        <div className="shap-track">
                          <div className="shap-center" />
                          <div
                            className={`shap-fill ${isPositive ? 'shap-pos' : 'shap-neg'}`}
                            style={{
                              width: `${pct / 2}%`,
                              [isPositive ? 'left' : 'right']: '50%',
                            }}
                          />
                        </div>
                        <span className={`shap-val ${isPositive ? 'shap-val-pos' : 'shap-val-neg'}`}>
                          {value > 0 ? '+' : ''}{value.toFixed(4)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* LIME Values */}
          {useApi && apiResult.lime_values && (
            <div className="explainer-card">
              <h2 className="explainer-title">
                <span aria-hidden="true">🧪</span> LIME Explanations
              </h2>
              <p className="explainer-desc">
                Local feature contributions explaining this specific prediction.
              </p>
              <div className="lime-list">
                {Object.entries(apiResult.lime_values)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .map(([rule, weight]) => (
                    <div key={rule} className="lime-row">
                      <span className="lime-rule">{rule}</span>
                      <span
                        className={`lime-weight ${weight >= 0 ? 'lime-weight-pos' : 'lime-weight-neg'}`}
                      >
                        {weight > 0 ? '+' : ''}{weight.toFixed(4)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="suggestions-card">
            <h2 className="suggestions-title">
              <span aria-hidden="true">💡</span> Recommended Next Steps
            </h2>
            <ul className="suggestions-list">
              {risk.suggestions.map((s, i) => (
                <li key={i} className="suggestion-item">
                  <span className="suggestion-icon" aria-hidden="true">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer" role="note">
            <strong>Important:</strong> This screening tool is based on the PHQ-9
            questionnaire and is for educational/informational purposes only. It
            does not provide a clinical diagnosis. If you are experiencing distress,
            please reach out to a qualified mental health professional or contact a
            crisis helpline.
          </div>

          {/* Actions */}
          <div className="result-actions">
            <button
              className="btn btn-primary"
              onClick={onRetake}
              id="retake-btn"
              aria-label="Retake the assessment"
            >
              <span className="btn-icon" aria-hidden="true">🔄</span>
              Retake Assessment
            </button>
          </div>
        </>
      )}
    </div>
  );
}
