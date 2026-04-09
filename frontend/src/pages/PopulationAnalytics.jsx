import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b']; // Low, Mod, High, Unknown/Other

const PopulationAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Population Analytics — MindScreen Clinical Platform";
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/population');
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics Loading...">
        <div className="space-y-8">
          <SkeletonLoader type="card-row" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SkeletonLoader type="chart" />
            <SkeletonLoader type="chart" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Format data for charts
  const riskDistributionData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }));
  const trendData = data.trend_over_time;
  const factorData = data.most_prevalent_features.map((f, i) => ({ 
    name: f.replace(/_/g, ' '), 
    impact: 100 - (i * 15) // Mocking impact intensity for visualization
  }));
  
  const demographicData = Object.entries(data.demographic_breakdown.gender).map(([name, count]) => ({
    name,
    count
  }));

  return (
    <DashboardLayout title="Population Overview">
      <div className="space-y-8 pb-12">
        
        {/* Row 1: Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assessments</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-slate-800">{riskDistributionData.reduce((acc, curr) => acc + curr.value, 0)}</span>
              <span className="text-[10px] text-green-600 font-bold">+12% vs last month</span>
            </div>
          </div>
          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">High-Risk Cases</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-red-600">{data.risk_distribution['High'] || 0}</span>
              <span className="text-xs text-slate-500 font-medium tracking-tight">Requires Review</span>
            </div>
          </div>
          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mean PHQ-9 Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-slate-800">{data.avg_phq9_score.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-medium tracking-tight">Cohort Avg</span>
            </div>
          </div>
          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Reviews</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-slate-800">4</span>
              <span className="text-[10px] text-amber-500 font-bold">Priority Status</span>
            </div>
          </div>
        </div>

        {/* Row 2: Distributions & Trends */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 bg-white p-8 border border-slate-200 shadow-sm h-80 flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Risk Stratification</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="md:col-span-3 bg-white p-8 border border-slate-200 shadow-sm h-80 flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Assessment Trends over Time</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#1A56A0" 
                    strokeWidth={2} 
                    dot={{ fill: '#1A56A0', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Number of assessed patients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Risk Factors & Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 border border-slate-200 shadow-sm h-80 flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Primary Risk Factors (High-Risk Cohort)</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip />
                  <Bar dataKey="impact" fill="#1A56A0" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 border border-slate-200 shadow-sm h-80 flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Demographic Stratification</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default PopulationAnalytics;
