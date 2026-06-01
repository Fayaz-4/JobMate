import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';
import Footer from '../components/Footer/Footer.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // 1. Identify splitscreen authentication pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(path);

  // 2. Identify candidate authenticated pages requiring the shared Sidebar
  const candidatePaths = ['/dashboard', '/jobs', '/job-details', '/today-digest', '/profile', '/resume-upload', '/skill-extraction', '/applications', '/placement-readiness', '/interview-prep', '/realtime-interview'];
  const showSidebar = candidatePaths.some(p => path === p || path.startsWith(p + '/'));

  // 3. Shared Sidebar States (Collapsible on Desktop/Tablet, Drawer on Mobile)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse sidebar on smaller screens (tablets)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth > 1024) {
        setIsCollapsed(false);
      }
    };

    handleResize(); // trigger initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between overflow-x-hidden">
        <div className="flex-1 flex flex-col justify-center w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full bg-slate-50 overflow-x-hidden">
      {/* 1. Global Shared Header / Navbar */}
      <Navbar />

      {/* 2. Middle Row Area (Sidebar + Main Content Panel) */}
      <div className="flex-1 flex flex-col w-full max-w-full">
        {showSidebar ? (
          <div className="flex-1 flex flex-col md:flex-row w-full max-w-full relative">
            
            {/* Mobile Sidebar Trigger Bar (Visible only on Mobile md-) */}
            <div className="md:hidden flex items-center bg-slate-900 text-white px-5 py-3 shrink-0 select-none shadow-md">
              <button 
                onClick={() => setIsMobileOpen(true)} 
                className="p-1 hover:bg-slate-800 rounded transition cursor-pointer"
                title="Open menu"
              >
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="ml-3.5 font-extrabold text-xs uppercase tracking-widest text-slate-300">Navigation Menu</span>
            </div>

            {/* Shared Collapsible / Hamburger Sidebar */}
            <Sidebar 
              isCollapsed={isCollapsed} 
              onToggleCollapse={toggleSidebarCollapse}
              isMobileOpen={isMobileOpen}
              onCloseMobile={() => setIsMobileOpen(false)}
            />

            {/* Candidate Content Body */}
            <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col justify-between">
              <div className="flex-grow w-full">
                {children}
              </div>
            </main>

          </div>
        ) : (
          /* Public / Marketing flow (Home, Apply, redirects) */
          <main className="flex-1 w-full max-w-full">
            {children}
          </main>
        )}
      </div>

      {/* 3. Global Shared Footer */}
      <Footer />
    </div>
  );
};

export default AppLayout;
