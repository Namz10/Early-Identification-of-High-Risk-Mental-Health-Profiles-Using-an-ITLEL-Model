import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PatientTable from '../components/PatientTable';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';

const DashboardRoster = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Patient Roster — MindScreen Clinical Platform";
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/');
      // Map API fields if they differ slightly from table expectations
      const data = response.data.map(p => ({
        ...p,
        // Ensure keys Match our table: id, name, last_assessment_date, phq9_score (risk_level, confidence_score)
        phq9_score: p.phq9_score || (p.raw_score !== undefined ? p.raw_score : null),
        latest_assessment_id: p.latest_assessment_id || (p.assessment_id)
      }));
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Patient Roster">
      {loading ? (
        <div className="bg-white border border-slate-200 p-8 shadow-sm h-[calc(100vh-200px)]">
          <SkeletonLoader type="table" />
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)]">
          <PatientTable patients={patients} loading={loading} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardRoster;
