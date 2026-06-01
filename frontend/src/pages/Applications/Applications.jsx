import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication 
} from '../../services/applicationService';

const Applications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateSort, setDateSort] = useState('newest'); // 'newest' | 'oldest'

  // Modals state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form Fields State
  const [formFields, setFormFields] = useState({
    companyName: '',
    jobTitle: '',
    applicationSource: 'LinkedIn',
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Applied',
    currentRound: 'None',
    notes: '',
    applicationUrl: ''
  });

  // Load active tab from URL search parameters (?tab=interview etc.)
  const tabParam = searchParams.get('tab') || 'all';
  const activeTab = tabParam.toLowerCase();

  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserMeta({
          fullName: parsed.fullName || 'User Profile',
          email: parsed.email || 'user@example.com',
        });
      } catch (e) {
        console.warn('Could not parse user metadata from localStorage');
      }
    }
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to fetch job applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Summary counts
  const totalApps = applications.length;
  const appliedApps = applications.filter(a => a.status === 'Applied').length;
  const interviewScheduledApps = applications.filter(a => a.status === 'Interview Scheduled').length;
  const interviewCompletedApps = applications.filter(a => a.status === 'Interview Completed').length;
  const selectedApps = applications.filter(a => a.status === 'Selected').length;
  const rejectedApps = applications.filter(a => a.status === 'Rejected').length;
  const offerReceivedApps = applications.filter(a => a.status === 'Offer Received').length;

  // Filter & Search Logic
  const getFilteredApplications = () => {
    let result = [...applications];

    // 1. Search Query filter (Company / Role)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        a.companyName.toLowerCase().includes(query) || 
        a.jobTitle.toLowerCase().includes(query)
      );
    }

    // 2. Status Dropdown filter
    if (statusFilter !== 'All') {
      result = result.filter(a => a.status === statusFilter);
    }

    // 3. Horizontal Status Tabs filter
    if (activeTab === 'applied') {
      result = result.filter(a => a.status === 'Applied');
    } else if (activeTab === 'interview_scheduled') {
      result = result.filter(a => a.status === 'Interview Scheduled');
    } else if (activeTab === 'interview_completed') {
      result = result.filter(a => a.status === 'Interview Completed');
    } else if (activeTab === 'selected') {
      result = result.filter(a => a.status === 'Selected');
    } else if (activeTab === 'rejected') {
      result = result.filter(a => a.status === 'Rejected');
    } else if (activeTab === 'offer_received') {
      result = result.filter(a => a.status === 'Offer Received');
    }

    // 4. Date Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.appliedDate);
      const dateB = new Date(b.appliedDate);
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  };

  const filteredAppsList = getFilteredApplications();

  // CRUD actions
  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedApp(null);
    setFormFields({
      companyName: '',
      jobTitle: '',
      applicationSource: 'LinkedIn',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      currentRound: 'None',
      notes: '',
      applicationUrl: ''
    });
    setFormModalOpen(true);
  };

  const openEditModal = (app) => {
    setIsEditMode(true);
    setSelectedApp(app);
    setFormFields({
      companyName: app.companyName,
      jobTitle: app.jobTitle,
      applicationSource: app.applicationSource,
      appliedDate: app.appliedDate,
      status: app.status,
      currentRound: app.currentRound,
      notes: app.notes || '',
      applicationUrl: app.applicationUrl || ''
    });
    setFormModalOpen(true);
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setViewModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formFields.companyName.trim() || !formFields.jobTitle.trim()) {
      setError('Company Name and Job Title are required.');
      return;
    }

    try {
      if (isEditMode && selectedApp) {
        const updated = await updateApplication(selectedApp.id, formFields);
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? updated : a));
        setSuccess('Application updated successfully.');
      } else {
        const created = await createApplication(formFields);
        setApplications(prev => [created, ...prev]);
        setSuccess('Application created successfully.');
      }
      setFormModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application form.');
    }
  };

  const handleDelete = async (id, company) => {
    if (!window.confirm(`Are you sure you want to delete your application for ${company}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      setSuccess(`Application for ${company} deleted successfully.`);
    } catch (err) {
      setError('Failed to delete application.');
    }
  };

  // Status Styled Badges helper
  const getStatusBadge = (status) => {
    const base = "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide border ";
    switch (status) {
      case 'Selected':
        return base + "bg-emerald-50 text-emerald-700 border-emerald-150";
      case 'Rejected':
        return base + "bg-rose-50 text-rose-700 border-rose-150";
      case 'Interview Scheduled':
        return base + "bg-violet-50 text-violet-700 border-violet-150";
      case 'Interview Completed':
        return base + "bg-indigo-50 text-indigo-700 border-indigo-150";
      case 'Offer Received':
        return base + "bg-amber-50 text-amber-700 border-amber-150";
      case 'Applied':
      default:
        return base + "bg-sky-50 text-sky-700 border-sky-150";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      
      {/* Sub Header Segment */}
      <div className="border-b border-slate-200 bg-white pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-black text-slate-900">Applications Tracker</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openAddModal}
            className="rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-150 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 transition duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Application
          </button>
        </div>
      </div>

      {/* Notification banners */}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 shadow-sm">
          🎉 {success}
        </div>
      )}

      {/* Summary KPI Cards Grid (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* TOTAL */}
        <div 
          onClick={() => handleTabChange('all')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'all' ? 'border-slate-500 ring-2 ring-slate-100' : 'border-slate-200'}`}
        >
          <span className="text-slate-450 text-[9px] font-black uppercase tracking-wider">Total</span>
          <span className="text-2xl font-black text-slate-900 mt-2">{totalApps}</span>
          <p className="text-[9px] font-bold text-slate-500 mt-2">All →</p>
        </div>

        {/* APPLIED */}
        <div 
          onClick={() => handleTabChange('applied')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'applied' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'}`}
        >
          <span className="text-sky-500 text-[9px] font-black uppercase tracking-wider">Applied</span>
          <span className="text-2xl font-black text-sky-600 mt-2">{appliedApps}</span>
          <p className="text-[9px] font-bold text-sky-600 mt-2">Review →</p>
        </div>

        {/* INTERVIEW SCHEDULED */}
        <div 
          onClick={() => handleTabChange('interview_scheduled')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'interview_scheduled' ? 'border-violet-500 ring-2 ring-violet-100' : 'border-slate-200'}`}
        >
          <span className="text-violet-500 text-[9px] font-black uppercase tracking-wider">Int Scheduled</span>
          <span className="text-2xl font-black text-violet-600 mt-2">{interviewScheduledApps}</span>
          <p className="text-[9px] font-bold text-violet-600 mt-2">Upcoming →</p>
        </div>

        {/* INTERVIEW COMPLETED */}
        <div 
          onClick={() => handleTabChange('interview_completed')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'interview_completed' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}
        >
          <span className="text-indigo-500 text-[9px] font-black uppercase tracking-wider">Int Completed</span>
          <span className="text-2xl font-black text-indigo-600 mt-2">{interviewCompletedApps}</span>
          <p className="text-[9px] font-bold text-indigo-600 mt-2">Done →</p>
        </div>

        {/* SELECTED */}
        <div 
          onClick={() => handleTabChange('selected')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'selected' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
        >
          <span className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">Selected</span>
          <span className="text-2xl font-black text-emerald-600 mt-2">{selectedApps}</span>
          <p className="text-[9px] font-bold text-emerald-600 mt-2">Success →</p>
        </div>

        {/* REJECTED */}
        <div 
          onClick={() => handleTabChange('rejected')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'rejected' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200'}`}
        >
          <span className="text-rose-500 text-[9px] font-black uppercase tracking-wider">Rejected</span>
          <span className="text-2xl font-black text-rose-600 mt-2">{rejectedApps}</span>
          <p className="text-[9px] font-bold text-rose-600 mt-2">Closed →</p>
        </div>

        {/* OFFER RECEIVED */}
        <div 
          onClick={() => handleTabChange('offer_received')}
          className={`rounded-3xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition duration-200 hover:scale-[1.01] bg-white ${activeTab === 'offer_received' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200'}`}
        >
          <span className="text-amber-500 text-[9px] font-black uppercase tracking-wider">Offers</span>
          <span className="text-2xl font-black text-amber-600 mt-2">{offerReceivedApps}</span>
          <p className="text-[9px] font-bold text-amber-600 mt-2">Rewards →</p>
        </div>
      </div>

      {/* Advanced Filters panel */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="w-full md:w-1/2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="w-full md:w-1/4 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Interview Completed">Interview Completed</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer Received">Offer Received</option>
          </select>
        </div>

        <div className="w-full md:w-1/4 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sort Date</label>
          <select
            value={dateSort}
            onChange={(e) => setDateSort(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
          >
            <option value="newest">Newest Applied</option>
            <option value="oldest">Oldest Applied</option>
          </select>
        </div>
      </div>

      {/* Horizontal Status tabs selectors */}
      <div className="flex border-b border-slate-250 bg-white px-6 gap-6 shrink-0 overflow-x-auto scrollbar-none shadow-xs select-none">
        {[
          { key: 'all', label: 'All Applications', count: totalApps },
          { key: 'applied', label: 'Applied', count: appliedApps },
          { key: 'interview_scheduled', label: 'Int Scheduled', count: interviewScheduledApps },
          { key: 'interview_completed', label: 'Int Completed', count: interviewCompletedApps },
          { key: 'selected', label: 'Selected', count: selectedApps },
          { key: 'rejected', label: 'Rejected', count: rejectedApps },
          { key: 'offer_received', label: 'Offers', count: offerReceivedApps }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`pb-3.5 pt-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === tab.key 
                ? 'border-violet-600 text-violet-600' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span className={`inline-flex rounded-full text-[10px] font-black px-2 py-0.5 transition ${
              activeTab === tab.key 
                ? 'bg-violet-100 text-violet-700' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Professional Applications Data Table */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100/50 space-y-6">
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500">Querying Application Telemetry...</p>
          </div>
        ) : filteredAppsList.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center gap-4 text-center py-10">
            <div className="h-14 w-14 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-slate-900">No Job Applications Found</h4>
            <p className="text-xs font-semibold text-slate-400 max-w-sm">
              We couldn't locate any application records matching your search queries or active tab filters. Use the Add Application button above to register one manually!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-3xl">
            <table className="w-full text-left border-collapse text-xs text-slate-600">
              <thead className="bg-slate-50 font-black text-slate-800 uppercase tracking-wider select-none">
                <tr>
                  <th className="px-6 py-4 rounded-tl-3xl">Company</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Application URL</th>
                  <th className="px-6 py-4">Current Round</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 rounded-tr-3xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAppsList.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-slate-900 font-bold truncate max-w-[150px]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-black text-sm shrink-0">
                          {app.companyName.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate">{app.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 truncate max-w-[150px]">
                      {app.jobTitle}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(app.appliedDate).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 truncate max-w-[155px]">
                      {app.applicationUrl ? (
                        <a
                          href={app.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-850 font-bold hover:underline"
                        >
                          Visit Website
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500">
                      {app.currentRound}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(app.lastUpdated).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition cursor-pointer"
                          title="View Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition cursor-pointer"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app.id, app.companyName)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl space-y-6 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-lg">
                  {selectedApp.companyName.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">{selectedApp.jobTitle}</h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedApp.companyName}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="rounded-full border border-slate-250 p-2 hover:bg-slate-50 hover:text-slate-900 transition text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Application Status</span>
                <div className="mt-1.5">{getStatusBadge(selectedApp.status)}</div>
              </div>

              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Current Round</span>
                <span className="mt-1.5 block font-extrabold text-slate-800 text-sm">{selectedApp.currentRound}</span>
              </div>

              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Applied Date</span>
                <span className="mt-1.5 block font-bold text-slate-700">{new Date(selectedApp.appliedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Application Source</span>
                <span className="mt-1.5 block font-bold text-slate-700">{selectedApp.applicationSource}</span>
              </div>

              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100 col-span-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Application URL</span>
                {selectedApp.applicationUrl ? (
                  <a
                    href={selectedApp.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-850 font-bold hover:underline break-all"
                  >
                    {selectedApp.applicationUrl}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                ) : (
                  <span className="mt-1.5 block text-slate-400 italic">None provided</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Recruiter / Activity Notes</span>
              <p className="mt-2 text-slate-600 font-semibold leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100">
                {selectedApp.notes || 'No active notes registered for this pipeline. Click Edit to record custom updates.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 select-none">
              <span>Created: {new Date(selectedApp.createdAt).toLocaleDateString()}</span>
              <span>Last Active: {new Date(selectedApp.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT APPLICATION FORM MODAL */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-950 text-lg">
                  {isEditMode ? 'Edit Job Pipeline' : 'Register New Application'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Record key metrics to track this application in one workspace.
                </p>
              </div>
              <button 
                onClick={() => setFormModalOpen(false)}
                className="rounded-full border border-slate-250 p-2 hover:bg-slate-50 hover:text-slate-900 transition text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formFields.companyName}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Swiggy"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Job Title / Role *</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formFields.jobTitle}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. QA Automation"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Source</label>
                  <input
                    type="text"
                    name="applicationSource"
                    value={formFields.applicationSource}
                    onChange={handleFormChange}
                    placeholder="e.g. LinkedIn, Foundit"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Applied Date</label>
                  <input
                    type="date"
                    name="appliedDate"
                    value={formFields.appliedDate}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select
                    name="status"
                    value={formFields.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Interview Completed">Interview Completed</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offer Received">Offer Received</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Current Round</label>
                  <input
                    type="text"
                    name="currentRound"
                    value={formFields.currentRound}
                    onChange={handleFormChange}
                    placeholder="e.g. Technical Round 1, HR"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Application URL</label>
                <input
                  type="url"
                  name="applicationUrl"
                  value={formFields.applicationUrl}
                  onChange={handleFormChange}
                  placeholder="e.g. https://company.com/careers/role"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Recruiter / Interview Notes</label>
                <textarea
                  name="notes"
                  value={formFields.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Record custom comments, scheduling links, contacts..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-violet-600 py-3 text-xs font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700 transition mt-6 cursor-pointer"
              >
                {isEditMode ? 'Save Changes' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Applications;
