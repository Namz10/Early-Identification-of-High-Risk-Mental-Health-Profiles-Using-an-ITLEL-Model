import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import RiskBadge from '../components/RiskBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import { formatDate, formatConfidence, buildReferenceId } from '../services/utils';
import { PHQ9_QUESTIONS, RESPONSE_OPTIONS } from '../assets/phq9';

const ReportView = () => {
  const { id, assessmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.title = "Assessment Report — MindScreen Clinical Platform";
    fetchData();
  }, [id, assessmentId]);

  const fetchData = async () => {
    try {
      // 1. Fetch Assessment Main Data
      const assessmentRes = await api.get(`/assessments/${assessmentId}`);
      const assessment = assessmentRes.data;

      // 2. Fetch Patient Bio (from analytics or roster context - here we'll fetch profile)
      const patientRes = await api.get(`/patients/${id}`);
      
      setData({
        assessment,
        patient: patientRes.data
      });

      // 3. Lazy load SHAP and LLM recommendations (Trigger endpoints)
      // These endpoints store results in DB and return them
      const [shapRes, llmRes] = await Promise.all([
        api.post('/reports/shap-narrative', { assessment_id: parseInt(assessmentId) }),
        api.post('/reports/llm-recommendation', { assessment_id: parseInt(assessmentId) })
      ]);

      setReportData({
        shap: shapRes.data,
        llm: llmRes.data
      });

    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/reports/${assessmentId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `MSC_Report_${data.patient.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Download failed', err);
      alert('Could not generate PDF. Please try again later.');
    } finally {
      setDownloading(false);
    }
  };

  // Format SHAP data for chart
  const chartData = useMemo(() => {
    if (!data?.assessment?.shap_values) return [];
    return Object.entries(data.assessment.shap_values)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: parseFloat(value.toFixed(4))
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 8); // Top 8 features
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout title="Loading Report...">
        <div className="max-w-4xl mx-auto space-y-8 bg-white p-12 border border-slate-200">
          <SkeletonLoader lines={2} />
          <div className="h-px bg-slate-100" />
          <SkeletonLoader type="table" />
          <div className="h-px bg-slate-100" />
          <SkeletonLoader type="paragraph" lines={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return <DashboardLayout title="Report Not Found">Error loading report.</DashboardLayout>;

  const { assessment, patient } = data;

  return (
    <DashboardLayout title={`Report: ${patient.name}`}>
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-32">
        
        {/* PAGE CONTENT: Clinical Document Style */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Section 1: Patient Header */}
          <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-light text-slate-800">{patient.name}</h1>
                <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 text-slate-400 uppercase tracking-widest">
                  {buildReferenceId(assessment.id, assessment.submitted_at)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date of Birth</span>
                  <span className="text-sm text-slate-700">{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'Unavailable'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assessment Date</span>
                  <span className="text-sm text-slate-700 font-medium">{formatDate(assessment.submitted_at)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinician Assigned</span>
                  <span className="text-sm text-slate-700 underline decoration-slate-200 decoration-1 underline-offset-4">Dr. Specialist</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-12 h-12 bg-primary flex items-center justify-center text-white mb-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Confidential Clinical Report</p>
            </div>
          </div>

          {/* Section 2: Assessment Responses */}
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Standardized Assessment (PHQ-9)</h3>
            <div className="border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 font-bold text-slate-500 w-12">#</th>
                    <th className="px-4 py-2 font-bold text-slate-500">Domain / Item</th>
                    <th className="px-4 py-2 font-bold text-slate-500 text-right">Response</th>
                    <th className="px-4 py-2 font-bold text-slate-500 text-right w-20">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assessment.phq9_responses.map((score, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-slate-400 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-700">{PHQ9_QUESTIONS[index]}</td>
                      <td className="px-4 py-3 text-right text-slate-600 italic">
                        {RESPONSE_OPTIONS.find(o => o.value === score)?.label || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{score}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td colSpan="3" className="px-4 py-4 text-slate-500 uppercase tracking-wider text-xs">Aggregate Clinical Score</td>
                    <td className="px-4 py-4 text-right text-lg text-primary">{assessment.raw_score} <span className="text-[10px] text-slate-400">/ 27</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Risk Classification */}
          <div className="p-10 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50/20">
            <div className="flex flex-col justify-center border-r border-slate-100 pr-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Classification</span>
              <RiskBadge level={assessment.risk_level} />
              <p className="mt-2 text-[10px] text-slate-400 italic">Confidence Index: {formatConfidence(assessment.confidence_score)}</p>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center md:text-left">Severity Index Scale (PHQ-9)</span>
              <div className="relative h-4 bg-slate-200 rounded-full w-full">
                {/* Scale markers */}
                {[0, 5, 10, 15, 20, 27].map(m => (
                  <div key={m} className="absolute top-6 text-[9px] text-slate-300 font-bold" style={{ left: `${(m/27)*100}%`, transform: 'translateX(-50%)' }}>{m}</div>
                ))}
                {/* Risk segments */}
                <div className="absolute top-0 left-0 h-4 bg-green-200/50 rounded-l-full" style={{ width: '18%' }}></div>
                <div className="absolute top-0 left-[18%] h-4 bg-amber-200/50" style={{ width: '19%' }}></div>
                <div className="absolute top-0 left-[37%] h-4 bg-orange-200/50" style={{ width: '15%' }}></div>
                <div className="absolute top-0 left-[52%] h-4 bg-red-200/50 rounded-r-full" style={{ width: '48%' }}></div>
                {/* Pointer */}
                <div 
                  className="absolute -top-1 w-6 h-6 bg-white border-2 border-primary rounded-full shadow-md z-10 transition-all duration-1000 flex items-center justify-center -translate-x-1/2"
                  style={{ left: `${(assessment.raw_score/27)*100}%` }}
                >
                  <span className="text-[8px] font-black text-primary">{assessment.raw_score}</span>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Minimal</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Mild</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Moderate</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Moderately Severe</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Severe</span>
              </div>
            </div>
          </div>

          {/* Section 4: Explainability (SHAP) */}
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 px-1 border-l-4 border-primary">Explainability Diagnostics (SHAP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {reportData?.shap?.shap_narrative || "Analyzing underlying feature contributions..."}
                </p>
                <div className="bg-slate-50 p-4 border border-slate-100">
                  <p className="text-[9px] text-slate-400 leading-tight">
                    SHAP (SHapley Additive exPlanations) values indicate the relative impact of individual clinical items on the model's final risk classification. Positive values (red) increase identified risk; negative values (green) indicate protective factors.
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={chartData} 
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      width={120}
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                    />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} />
                    <ReferenceLine x={0} stroke="#cbd5e1" />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#ef4444' : '#10b981'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 5: Clinical Recommendations */}
          <div className="p-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 px-1 border-l-4 border-primary">Clinician Recommendation Engine</h3>
            {reportData?.llm ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                {reportData.llm.llm_recommendation.split('. ').map((point, idx) => {
                  if (!point.trim()) return null;
                  const [title, ...rest] = point.split(': ');
                  return (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{title}</span>
                      <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-slate-100 pl-4">
                        {rest.join(': ') || point}.
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SkeletonLoader type="paragraph" lines={4} />
            )}
          </div>
        </div>

        {/* Footnote Accessibility */}
        <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
          MindScreen Diagnostic Support v1.0.4 • Automated Clinical Logic Verified
        </p>

        {/* Sticky Footer Action */}
        <div className="fixed bottom-0 left-[240px] right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40 flex justify-center backdrop-blur-sm bg-white/90">
          <div className="max-w-5xl w-full flex justify-between items-center px-10">
            <button 
              onClick={() => navigate('/dashboard/patients')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7 7-7" /></svg>
              Return to Roster
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="bg-primary text-white px-8 py-3 text-xs font-bold uppercase tracking-widest flex items-center hover:bg-opacity-90 transition-all rounded-sm disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating report…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
                  Download Clinical Report (PDF)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportView;
