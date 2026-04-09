import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import { formatDate, formatConfidence } from '../services/utils';

const PatientTable = ({ patients, loading }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Filtering Logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(p.id).includes(searchTerm);
    const matchesRisk = riskFilter === 'All' || p.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Sorting Logic
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aValue, bValue;
    
    if (sortConfig.key === 'date') {
      aValue = new Date(a.last_assessment_date || 0);
      bValue = new Date(b.last_assessment_date || 0);
    } else if (sortConfig.key === 'score') {
      aValue = a.phq9_score || 0;
      bValue = b.phq9_score || 0;
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
        <div className="flex gap-2 items-center flex-grow max-w-md">
          <div className="relative flex-grow">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 focus:outline-none focus:border-primary placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="text-sm border border-slate-200 px-3 py-2 focus:outline-none focus:border-primary bg-white"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
        
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {sortedPatients.length} Patients Identified
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto overflow-y-auto flex-grow">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
              <th 
                className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary"
                onClick={() => requestSort('date')}
              >
                Last Assessment {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary"
                onClick={() => requestSort('score')}
              >
                Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status / Risk</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Confidence</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPatients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: MSC-{String(p.id).padStart(4, '0')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {p.last_assessment_date ? formatDate(p.last_assessment_date) : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${p.phq9_score >= 10 ? 'text-slate-800' : 'text-slate-500'}`}>
                      {p.phq9_score ?? '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">/ 27</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <RiskBadge level={p.risk_level} />
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-slate-600 tabular-nums">
                  {formatConfidence(p.confidence_score)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => navigate(`/dashboard/patients/${p.id}/report/${p.latest_assessment_id}`)}
                    className="text-xs font-bold text-primary px-3 py-1.5 border border-primary/20 hover:bg-primary hover:text-white transition-all rounded-sm opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    disabled={!p.latest_assessment_id}
                  >
                    View Report
                  </button>
                </td>
              </tr>
            ))}
            {sortedPatients.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <p className="text-slate-400 text-sm italic">No assessments recorded for this patient.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-xs text-slate-400 font-medium">
        <div>Showing {sortedPatients.length} of {patients.length} records</div>
        <div className="flex gap-1">
          <button className="px-2 py-1 border border-slate-200 rounded-sm hover:bg-white disabled:opacity-30" disabled>Previous</button>
          <button className="px-2 py-1 border border-slate-200 rounded-sm bg-white text-primary">1</button>
          <button className="px-2 py-1 border border-slate-200 rounded-sm hover:bg-white disabled:opacity-30" disabled>Next</button>
        </div>
      </div>
    </div>
  );
};

export default PatientTable;
