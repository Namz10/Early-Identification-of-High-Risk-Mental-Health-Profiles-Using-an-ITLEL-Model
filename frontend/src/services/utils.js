/**
 * Format a date string to DD MMM YYYY
 * e.g. "2026-01-09T..." → "09 Jan 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, ' ');
};

/**
 * Format a confidence score as percentage string
 * e.g. 0.873 → "87.3%"
 */
export const formatConfidence = (score) => {
  if (score === null || score === undefined) return '—';
  return `${(score * 100).toFixed(1)}%`;
};

/**
 * Build a clinical reference ID from assessment data
 */
export const buildReferenceId = (assessmentId, dateString) => {
  const dateStr = dateString
    ? new Date(dateString).toISOString().slice(0, 10).replace(/-/g, '')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `MSC-${dateStr}-${assessmentId}`;
};

/**
 * Risk level badge style objects (exact clinical spec)
 */
export const RISK_BADGE_STYLES = {
  High:     { bg: '#FEF2F2', text: '#991B1B' },
  Moderate: { bg: '#FFFBEB', text: '#92400E' },
  Low:      { bg: '#ECFDF5', text: '#065F46' },
};

export const getRiskBadgeStyle = (level) =>
  RISK_BADGE_STYLES[level] || { bg: '#F1F5F9', text: '#475569' };
