import React from 'react';
import { getRiskBadgeStyle } from '../services/utils';

const RiskBadge = ({ level }) => {
  if (!level) {
    return (
      <span
        style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
        className="inline-block px-2 py-0.5 text-xs font-semibold rounded-sm"
      >
        Awaiting Review
      </span>
    );
  }

  const { bg, text } = getRiskBadgeStyle(level);

  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className="inline-block px-2 py-0.5 text-xs font-semibold rounded-sm"
    >
      {level}
    </span>
  );
};

export default RiskBadge;
