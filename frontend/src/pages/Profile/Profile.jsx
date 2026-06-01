import React, { useState, useEffect } from 'react'
import { getProfile, createProfile, updateProfile } from '../../services/profileService'

const Profile = () => {
  const [loading, setLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // User details fetched from Auth (stored in JWT / decoded or stored on signup)
  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com'
  })

  // Profile fields state
  const [formData, setFormData] = useState({
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    location: '',
    degree: '',
    specialization: '',
    collegeName: '',
    graduationYear: '',
    cgpa: '',
    preferredRole: '',
    preferredLocation: '',
    experienceLevel: 'Fresher',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    skills: '', // Comma separated in DB
  })

  // Frontend validation state
  const [fieldErrors, setFieldErrors] = useState({})
  const [skillsList, setSkillsList] = useState([])
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    // 1. Recover user email/fullname from localStorage (if logged in, auth saves userDto)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUserMeta({
          fullName: parsed.fullName || 'User Profile',
          email: parsed.email || 'user@example.com'
        })
      } catch (e) {
        console.warn('Could not parse user metadata from localStorage')
      }
    }

    // 2. Fetch profile from backend
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProfile()
      if (data) {
        setProfileExists(!!data.id)
        if (!data.id) {
          setIsEditing(true) // Automatically put in edit mode to create
        }
        
        // Format Date of Birth for date input
        const dob = data.dateOfBirth ? data.dateOfBirth : ''
        
        if (data.user) {
          setUserMeta({
            fullName: data.user.fullName || 'User Profile',
            email: data.user.email || 'user@example.com',
            phone: data.user.phone || ''
          })
        }
        
        setFormData({
          phone: data.phone || (data.user?.phone || ''),
          dateOfBirth: dob,
          gender: data.gender || 'Male',
          location: data.location || '',
          degree: data.degree || '',
          specialization: data.specialization || '',
          collegeName: data.collegeName || '',
          graduationYear: data.graduationYear || '',
          cgpa: data.cgpa || '',
          preferredRole: data.preferredRole || '',
          preferredLocation: data.preferredLocation || '',
          experienceLevel: data.experienceLevel || 'Fresher',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          portfolioUrl: data.portfolioUrl || '',
          skills: data.skills || '',
        })

        if (data.skills) {
          setSkillsList(data.skills.split(',').map(s => s.trim()).filter(s => s.length > 0))
        } else {
          setSkillsList([])
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear validation error when typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Skills chips logic
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault()
      const cleanSkill = skillInput.trim()
      if (cleanSkill && !skillsList.includes(cleanSkill)) {
        const updated = [...skillsList, cleanSkill]
        setSkillsList(updated)
        setFormData(prev => ({ ...prev, skills: updated.join(',') }))
        setSkillInput('')
      }
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillsList.filter(s => s !== skillToRemove)
    setSkillsList(updated)
    setFormData(prev => ({ ...prev, skills: updated.join(',') }))
  }

  // Frontend Validations
  const validateForm = () => {
    const errors = {}
    
    // Required fields check
    const required = [
      'phone', 'degree', 'collegeName', 'graduationYear', 'cgpa',
      'preferredRole', 'preferredLocation', 'experienceLevel'
    ]
    required.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = 'This field is required.'
      }
    })

    // Graduation Year validation
    const year = parseInt(formData.graduationYear)
    const currentYear = new Date().getFullYear()
    if (formData.graduationYear && (isNaN(year) || year < 1900 || year > currentYear + 10)) {
      errors.graduationYear = `Must be between 1900 and ${currentYear + 10}.`
    }

    // CGPA validation
    const cgpa = parseFloat(formData.cgpa)
    if (formData.cgpa && (isNaN(cgpa) || cgpa < 0.0 || cgpa > 10.0)) {
      errors.cgpa = 'CGPA must be between 0.0 and 10.0.'
    }

    // Phone Number validation
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = 'Enter a valid phone number (8-20 digits).'
    }

    // URL validations
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/
    const urlFields = ['linkedinUrl', 'githubUrl', 'portfolioUrl']
    urlFields.forEach(field => {
      const val = formData[field]
      if (val && val.trim().length > 0) {
        // Simple protocol-independent validation
        if (!val.startsWith('http://') && !val.startsWith('https://')) {
          errors[field] = 'URL must start with http:// or https://'
        }
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!validateForm()) {
      setError('Please resolve all validation errors before saving.')
      return
    }

    setLoading(true)
    try {
      let savedProfile
      if (profileExists) {
        savedProfile = await updateProfile(formData)
        setSuccessMsg('Profile updated successfully!')
      } else {
        savedProfile = await createProfile(formData)
        setSuccessMsg('Profile created successfully!')
        setProfileExists(true)
      }
      
      setIsEditing(false)
      // Scroll to top to see success banner
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Ensure all inputs are correct.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Calculate dynamic Profile Completion %
  const calculateCompletion = () => {
    const fields = [
      formData.phone, formData.dateOfBirth, formData.gender, formData.location,
      formData.degree, formData.specialization, formData.collegeName, formData.graduationYear,
      formData.cgpa, formData.preferredRole, formData.preferredLocation, formData.experienceLevel,
      formData.linkedinUrl, formData.githubUrl, formData.portfolioUrl, formData.skills
    ]
    const filled = fields.filter(f => f && f.toString().trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }

  const completionPct = calculateCompletion()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      
      {/* Sub Header for Page Context */}
      <div className="border-b border-slate-200 bg-white pb-5 flex items-center justify-between shadow-xs select-none">
        <div>
          <h1 className="text-xl font-black text-slate-900">User Profile Settings</h1>
        </div>
      </div>
          
          {/* Notifications / Alerts Banners */}
          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
              🎉 {successMsg}
            </div>
          )}

          {/* Section 1: Profile Header Card */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-100 shrink-0">
                <span className="text-4xl font-extrabold">{userMeta.fullName.substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-3xl font-black text-slate-950">{userMeta.fullName}</h2>
                <p className="text-sm font-semibold text-slate-500">{userMeta.email}</p>
                <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 uppercase">
                  {formData.preferredRole || 'Candidate Profile'}
                </div>
              </div>
            </div>

            {/* Profile Completion Dial */}
            <div className="flex items-center gap-4 shrink-0 md:border-l md:border-slate-200 md:pl-8">
              <div className="relative h-20 w-20 flex items-center justify-center">
                {/* Visual Circle Counter */}
                <svg className="absolute transform -rotate-90 w-20 h-20">
                  <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke="#7c3aed" strokeWidth="6" fill="transparent"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={2 * Math.PI * 32 * (1 - completionPct / 100)} />
                </svg>
                <span className="text-base font-black text-slate-950">{completionPct}%</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Profile Completion</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Fill all sections to reach 100%</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Section 2: Personal Information */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-950">Personal Information</h3>
                <p className="text-sm text-slate-500">Your core identity and contact details.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Full Name (Read Only)</label>
                  <input type="text" value={userMeta.fullName} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4.5 py-3.5 text-sm text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Address (Read Only)</label>
                  <input type="text" value={userMeta.email} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4.5 py-3.5 text-sm text-slate-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing || !!userMeta.phone}
                    placeholder="Enter phone (e.g. 9876543210)"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm transition focus:border-violet-500 focus:outline-none ${
                      (!isEditing || !!userMeta.phone) ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-600 font-semibold">{fieldErrors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Current Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. San Francisco, CA"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Education */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-950">Education Details</h3>
                <p className="text-sm text-slate-500">Your academic credentials.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Degree / Qualification *</label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Bachelor of Engineering"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.degree && <p className="text-xs text-red-600 font-semibold">{fieldErrors.degree}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Computer Science"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">College / Institution *</label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter College Name"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.collegeName && <p className="text-xs text-red-600 font-semibold">{fieldErrors.collegeName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Graduation Year *</label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. 2024"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.graduationYear && <p className="text-xs text-red-600 font-semibold">{fieldErrors.graduationYear}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">CGPA / Percentage *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. 8.5"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.cgpa && <p className="text-xs text-red-600 font-semibold">{fieldErrors.cgpa}</p>}
                </div>
              </div>
            </div>

            {/* Section 4: Professional Information */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-950">Professional Information</h3>
                <p className="text-sm text-slate-500">Your career preferences and current stage.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Preferred Role *</label>
                  <input
                    type="text"
                    name="preferredRole"
                    value={formData.preferredRole}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Full Stack Developer"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.preferredRole && <p className="text-xs text-red-600 font-semibold">{fieldErrors.preferredRole}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Preferred Work Location *</label>
                  <input
                    type="text"
                    name="preferredLocation"
                    value={formData.preferredLocation}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Remote / Bangalore"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.preferredLocation && <p className="text-xs text-red-600 font-semibold">{fieldErrors.preferredLocation}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Experience Level *</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="0-1 Years">0-1 Years</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3+ Years">3+ Years</option>
                  </select>
                  {fieldErrors.experienceLevel && <p className="text-xs text-red-600 font-semibold">{fieldErrors.experienceLevel}</p>}
                </div>
              </div>
            </div>

            {/* Section 5: Social Links */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-950">Social Links</h3>
                <p className="text-sm text-slate-500">Provide profile links (URLs must start with http:// or https://).</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/username"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.linkedinUrl && <p className="text-xs text-red-600 font-semibold">{fieldErrors.linkedinUrl}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">GitHub URL</label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://github.com/username"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.githubUrl && <p className="text-xs text-red-600 font-semibold">{fieldErrors.githubUrl}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Portfolio URL</label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://username.dev"
                    className={`w-full rounded-2xl border px-4.5 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${
                      !isEditing ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-white text-slate-950 border-slate-300'
                    }`}
                  />
                  {fieldErrors.portfolioUrl && <p className="text-xs text-red-600 font-semibold">{fieldErrors.portfolioUrl}</p>}
                </div>
              </div>
            </div>

            {/* Section 6: Skills Section */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-950">Technical Skills</h3>
                <p className="text-sm text-slate-500">Add chips/tags for your top developer skills.</p>
              </div>

              {/* Skills List Grid */}
              <div className="flex flex-wrap gap-2.5">
                {skillsList.length > 0 ? (
                  skillsList.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4.5 py-2 text-sm font-bold text-violet-700 shadow-sm border border-violet-100/50"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-violet-400 hover:bg-violet-200 hover:text-violet-800 transition duration-150 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-400">No skills added yet.</p>
                )}
              </div>

              {/* Add Skill Control */}
              {isEditing && (
                <div className="flex max-w-sm items-center gap-3 pt-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="e.g. React, Spring Boot (Press Enter)"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4.5 py-3 text-sm focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Dashboard Action Controls Footer */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {!isEditing ? 'Profile details are currently in Read-Only mode.' : 'Ensure all fields are correctly formatted.'}
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {!isEditing ? 'Click Edit to update your details.' : 'Save to write updates to your database.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full bg-violet-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    {profileExists && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          loadProfile() // Reset fields
                        }}
                        className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-full bg-violet-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-700 disabled:bg-violet-400"
                    >
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </>
                )}
              </div>
            </div>

          </form>
    </div>
  )
}

export default Profile
