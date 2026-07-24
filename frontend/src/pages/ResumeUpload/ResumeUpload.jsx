import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { getResume, uploadResume, replaceResume, deleteResume } from '../../services/resumeService';
import { processResume, getExtractedProfile } from '../../services/skillExtractionService';
import { getJobs } from '../../services/jobService';

const ResumeUpload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumeExists, setResumeExists] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const loadMatchedJobs = async (skillsList) => {
    if (!skillsList || skillsList.length === 0) {
      setMatchedJobs([]);
      return;
    }
    setLoadingJobs(true);
    try {
      const allJobs = await getJobs();
      if (allJobs && allJobs.length > 0) {
        const cleanedUserSkills = skillsList.map(s => s.trim().toLowerCase());
        
        const scored = allJobs.map(job => {
          let matchingSkills = [];
          let missingSkills = [];
          let matchPercentage = 0;
          
          if (job.skillsRequired) {
            const requiredList = job.skillsRequired.split(',').map(s => s.trim());
            const cleanedRequired = requiredList.map(s => s.toLowerCase());
            
            cleanedRequired.forEach((reqSkill, idx) => {
              if (cleanedUserSkills.includes(reqSkill)) {
                matchingSkills.push(requiredList[idx]);
              } else {
                missingSkills.push(requiredList[idx]);
              }
            });
            
            if (requiredList.length > 0) {
              matchPercentage = Math.round((matchingSkills.length / requiredList.length) * 100);
            }
          }
          
          return {
            ...job,
            matchPercentage,
            matchingSkills,
            missingSkills
          };
        });
        
        // Sort by match percentage descending and keep top 5
        const sortedJobs = scored
          .filter(job => job.matchPercentage > 0)
          .sort((a, b) => b.matchPercentage - a.matchPercentage)
          .slice(0, 5);
          
        setMatchedJobs(sortedJobs);
      } else {
        setMatchedJobs([]);
      }
    } catch (err) {
      console.warn("Failed to fetch matching jobs", err);
      setMatchedJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    void loadResumeData();
  }, []);

  async function loadResumeData() {
    setLoading(true);
    setError('');
    try {
      const data = await getResume();
      if (data) {
        setResumeExists(true);
        setResumeInfo(data);

        // Fetch extraction profile details
        try {
          const profile = await getExtractedProfile();
          setExtractedProfile(profile);
          if (profile && profile.skills) {
            try {
              const skillsList = JSON.parse(profile.skills);
              await loadMatchedJobs(skillsList);
            } catch (jsonErr) {
              console.warn("Failed to parse skills JSON", jsonErr);
              setMatchedJobs([]);
            }
          } else {
            setMatchedJobs([]);
          }
        } catch {
          setExtractedProfile(null);
          setMatchedJobs([]);
        }
      } else {
        setResumeExists(false);
        setResumeInfo(null);
        setExtractedProfile(null);
        setMatchedJobs([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setResumeExists(false);
        setResumeInfo(null);
        setExtractedProfile(null);
        setMatchedJobs([]);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch resume status.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Drag Event Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSelectFile(file);
    }
  };

  const handleFileSelect = (e) => {
    setError('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file) => {
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError('Invalid file format. Allowed formats: PDF, DOC, DOCX.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the maximum limit of 10 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const triggerFileBrowser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleContainerClick = (e) => {
    // If a file is already selected, ignore container click (except for the nested buttons)
    if (selectedFile) {
      return;
    }
    // Prevent opening file explorer if clicking on buttons or their inner elements
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    triggerFileBrowser();
  };

  // Manual Skill Extraction Trigger
  const handleExtractSkills = async () => {
    if (!resumeInfo || !resumeInfo.id) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await processResume(resumeInfo.id);
      setSuccess('Technical skills and profile details extracted successfully!');
      await loadResumeData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract technical skills.');
    } finally {
      setProcessing(false);
    }
  };

  // Upload Trigger
  const handleUpload = async (e) => {
    e.stopPropagation(); // Prevent bubbling up to the parent onClick div!
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or drag a valid file first.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      let data;
      if (resumeExists && resumeInfo) {
        data = await replaceResume(resumeInfo.id, formData);
        setSuccess('Resume replaced successfully! Extracting skills...');
      } else {
        data = await uploadResume(formData);
        setSuccess('Resume uploaded successfully! Extracting skills...');
      }
      
      setSelectedFile(null);

      // Auto-extract skills
      const resumeId = data?.id;
      if (resumeId) {
        setProcessing(true);
        try {
          await processResume(resumeId);
          setSuccess('Resume uploaded and technical skills extracted successfully!');
        } catch (extractErr) {
          console.error('Failed to extract technical skills automatically', extractErr);
          setError('Resume uploaded, but automatic skill extraction encountered an issue. Try extracting manually.');
        } finally {
          setProcessing(false);
        }
      }

      // Re-trigger complete data load, instantly updating the Current Resume Box!
      await loadResumeData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resume file.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Trigger
  const handleDelete = async () => {
    if (!resumeInfo || !resumeInfo.id) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteResume(resumeInfo.id);
      setResumeExists(false);
      setResumeInfo(null);
      setExtractedProfile(null);
      setSuccess('Resume deleted successfully.');
    } catch {
      setError('Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  // View / Download Trigger
  const handleViewResume = async () => {
    if (!resumeExists || !resumeInfo) return;
    setError('');
    try {
      const response = await apiClient.get(`/resume/download/${resumeInfo.id}`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: resumeInfo.fileType });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch {
      setError('Could not download or open file from storage.');
    }
  };

  // Format File Size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      
      {/* Sub Header for Page Context */}
      <div className="border-b border-slate-200 bg-white pb-5 flex items-center justify-between shadow-xs select-none">
        <div>
          <h1 className="text-xl font-black text-slate-900">Resume Management</h1>
        </div>
      </div>

      {/* Notifications */}
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

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Checking Resume Information...</p>
        </div>
      ) : (
        /* Unified View Layout */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top row: Current Resume box and Upload Field box */}
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
            
            {/* Resume Overview Card */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-[360px]">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Current Resume</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Review your active file info.</p>
              </div>

              {resumeExists && resumeInfo ? (
                <div className="space-y-4 pt-4">
                  <div className="inline-flex rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 uppercase border border-emerald-100">
                    ● Active Uploaded
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-slate-900 truncate">{resumeInfo.originalFileName}</p>
                    <p className="text-xs text-slate-500">Size: <span className="font-bold text-slate-700">{formatBytes(resumeInfo.fileSize)}</span></p>
                    <p className="text-xs text-slate-500">Uploaded: <span className="font-bold text-slate-700">{new Date(resumeInfo.uploadedAt).toLocaleString()}</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="inline-flex rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700 uppercase border border-amber-100">
                    ● Missing Resume
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Please upload your resume to unlock matched opportunities and resume analysis.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {resumeExists && (
                  <>
                    <button
                      onClick={handleExtractSkills}
                      disabled={processing}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {processing ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : 'Extract Skills'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={handleViewResume}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        View File
                      </button>
                      <button
                        onClick={handleDelete}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-[2.5rem] border-2 border-dashed p-8 text-center flex flex-col justify-center items-center h-[360px] cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isDragOver 
                  ? 'border-violet-600 bg-violet-50/50 shadow-inner' 
                  : 'border-slate-300 bg-white hover:border-violet-400 hover:bg-slate-50/20'
              }`}
              onClick={handleContainerClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-violet-600 shadow-sm border border-violet-100/50 transition-transform duration-200 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>

              {!selectedFile ? (
                <>
                  <h4 className="text-xl font-bold text-slate-900">Drag & Drop your resume here</h4>
                  <p className="mt-2 text-sm text-slate-500 font-medium">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
                  <button
                    type="button"
                    className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                  >
                    Browse Files
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-violet-700">Ready to Upload:</p>
                  <p className="text-base font-bold text-slate-900 truncate max-w-sm">{selectedFile.name}</p>
                  <p className="text-xs font-bold text-slate-500">Size: {formatBytes(selectedFile.size)}</p>
                  
                  <div className="flex gap-3 pt-3 justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800"
                    >
                      Clear File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload(e);
                      }}
                      disabled={uploading}
                      className="rounded-full bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700"
                    >
                      {uploading ? 'Uploading...' : resumeExists ? 'Replace Resume' : 'Upload Resume'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Technical Skills & Matching Jobs Layout */}
          {resumeExists && (
            <div className="space-y-8 mt-8">
              
              {/* Technical Skills Section */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Extracted Technical Skills</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Core capabilities identified dynamically from your active resume</p>
                  </div>
                  {processing && (
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100 animate-pulse">
                      <div className="h-3.5 w-3.5 border-2 border-violet-700 border-t-transparent rounded-full animate-spin"></div>
                      Extracting Skills...
                    </div>
                  )}
                </div>

                {extractedProfile && extractedProfile.skills ? (
                  <div className="flex flex-wrap gap-2.5">
                    {(() => {
                      try {
                        const skills = JSON.parse(extractedProfile.skills);
                        if (skills && skills.length > 0) {
                          return skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-2xl bg-violet-50 hover:bg-violet-100 px-4 py-2 text-xs font-bold text-violet-700 hover:scale-105 transition duration-150 shadow-xs border border-violet-100/30"
                            >
                              {skill}
                            </span>
                          ));
                        }
                      } catch {
                        return (
                          <p className="text-sm font-semibold text-slate-400 py-2">
                            No technical skills parsed. Click "Extract Skills" above to run AI parsing.
                          </p>
                        );
                      }
                      return (
                        <p className="text-sm font-semibold text-slate-400 py-2">
                          No technical skills parsed. Click "Extract Skills" above to run AI parsing.
                        </p>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-3xl space-y-3">
                    <p className="text-sm font-semibold text-slate-500">No technical skills extracted yet.</p>
                    <p className="text-xs text-slate-400 font-medium">Click "Extract Skills" in the Current Resume card to parse your resume dynamically.</p>
                  </div>
                )}
              </div>

              {/* Matched Jobs Section */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/50">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-lg font-black text-slate-900">Matching Career Opportunities</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Vibrant roles matching your technical profile in our database</p>
                </div>

                {loadingJobs ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="h-8 w-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
                    <p className="text-xs font-semibold text-slate-500">Calculating profile alignment...</p>
                  </div>
                ) : matchedJobs && matchedJobs.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-1">
                    {matchedJobs.map((job) => {
                      const isHighMatch = job.matchPercentage >= 70;

                      return (
                        <div
                          key={job.id}
                          className="rounded-[2rem] border border-slate-100 bg-slate-50/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-violet-100 hover:bg-slate-50/70 transition duration-200"
                        >
                          <div className="space-y-4 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 font-extrabold text-lg shrink-0 select-none">
                                {(job.companyName || 'J').substring(0, 1)}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-900 text-base leading-snug">{job.jobTitle}</h4>
                                <p className="text-xs text-slate-500 font-bold">{job.companyName}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold pt-1">
                                  <span>📍 {job.location}</span>
                                  <span>•</span>
                                  <span>💰 {job.salary}</span>
                                  <span>•</span>
                                  <span>💼 {job.workMode || 'Hybrid'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Skills breakdown */}
                            <div className="space-y-2">
                              {job.matchingSkills && job.matchingSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[10px] font-black uppercase text-emerald-600 mr-1.5">Matching:</span>
                                  {job.matchingSkills.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100/50">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {job.missingSkills && job.missingSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[10px] font-black uppercase text-amber-500 mr-1.5">Missing:</span>
                                  {job.missingSkills.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 font-bold text-[10px] border border-amber-100/50">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center md:flex-col md:items-end justify-between md:justify-center gap-4">
                            <div className="md:text-right">
                              <span className="inline-flex rounded-full px-3 py-1 text-xs font-black border uppercase tracking-wider select-none shadow-inner font-mono leading-none align-middle justify-center items-center gap-1.5 bg-slate-900 text-white border-slate-950">
                                <span className={`h-2 w-2 rounded-full ${isHighMatch ? 'bg-emerald-400 animate-ping' : 'bg-violet-400'}`}></span>
                                {job.matchPercentage}% MATCH
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700 transition cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-3xl space-y-3">
                    <p className="text-sm font-semibold text-slate-500">No matching jobs found.</p>
                    <p className="text-xs text-slate-400 font-medium">This occurs if your active resume has no extracted skills or standard matches.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ResumeUpload;
