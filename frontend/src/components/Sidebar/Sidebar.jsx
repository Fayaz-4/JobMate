import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      ),
      isActive: currentPath === '/dashboard'
    },
    { 
      label: 'Jobs', 
      href: '/jobs', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H3.75c-.266 0-.523-.093-.717-.258m16.5 0a2.18 2.18 0 0 1-.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m0 0V4.5A2.25 2.25 0 0 0 14.25 2.25h-4.5A2.25 2.25 0 0 0 7.5 4.5v1.644m4.5 0a48.114 48.114 0 0 0-3.413.387" />
        </svg>
      ),
      isActive: currentPath === '/jobs' || currentPath.startsWith('/job-details')
    },
    { 
      label: 'Daily Digest', 
      href: '/today-digest', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      isActive: currentPath === '/today-digest'
    },
    { 
      label: 'Applications', 
      href: '/applications', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 9h6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      isActive: currentPath === '/applications'
    },
    { 
      label: 'Resume', 
      href: '/resume-upload', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
      ),
      isActive: currentPath === '/resume-upload' && !location.search.includes('tab=analysis')
    },
    { 
      label: 'Profile', 
      href: '/profile', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      isActive: currentPath === '/profile'
    },

  ];

  const handleNavClick = (href, e) => {
    e.preventDefault();
    navigate(href);
    if (onCloseMobile) onCloseMobile();
  };

  // Main wrapper classes
  const desktopWidthClass = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Frame */}
      <aside 
        className={`
          bg-slate-900 text-slate-400 p-6 flex flex-col justify-between shrink-0 transition-all duration-300
          /* Mobile Drawer Positioning */
          fixed inset-y-0 left-0 z-40 transform md:transform-none md:static md:h-auto md:min-h-full
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          /* Desktop & Tablet Width Control */
          ${desktopWidthClass}
        `}
      >
        <div className="space-y-8">
          {/* Logo / Drawer Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <a href="/" className="flex items-center gap-2 overflow-hidden select-none">
              <img 
                src="/logo.png" 
                alt="JobMate" 
                className="h-9 w-9 object-contain rounded-xl shadow-xs shrink-0" 
              />
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight text-white transition-opacity duration-200">
                  JobMate
                </span>
              )}
            </a>
            
            {/* Collapse Toggle Button (Visible on Desktop / Tablet md+) */}
            <button 
              onClick={onToggleCollapse}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white transition text-slate-500 cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className={`
                  group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition select-none
                  ${item.isActive 
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30' 
                    : 'hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-200">{item.label}</span>
                )}
                {!isCollapsed && item.isActive && (
                  <span className="relative flex h-2 w-2 ml-auto shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-100"></span>
                  </span>
                )}
              </a>
            ))}
            
            {/* Shared Logout Trigger */}
            <button
              onClick={handleLogout}
              className={`
                w-full text-left group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition cursor-pointer select-none
                hover:bg-slate-800 hover:text-white
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              </div>
              {!isCollapsed && <span className="truncate">Logout</span>}
            </button>
          </nav>
        </div>

        {/* Footer logged in profile display (Hide if collapsed) */}
        {!isCollapsed && (
          <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500 overflow-hidden select-none">
            <p>Logged in user</p>
            <p className="mt-1 font-bold text-slate-300 truncate">Candidate Profile</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
