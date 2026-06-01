import React from 'react'

const Footer = () => (
  <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="JobMate" 
              className="h-8 w-8 object-contain rounded-xl shadow-xs" 
            />
            <span className="text-xl font-bold tracking-tight text-white">JobMate</span>
          </div>
          <p className="text-sm leading-6 text-slate-400">
            Simplifying how candidates upload resumes, discover matched opportunities, and accelerate their careers.
          </p>
          <div className="flex items-center gap-3">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <span key={social} className="text-xs hover:text-white transition duration-200 cursor-pointer font-medium uppercase tracking-wider">
                {social}
              </span>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Resources</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {['About Us', 'Featured Companies', 'Pricing Models'].map((item) => (
              <li key={item}>
                <a href="/" className="hover:text-white transition duration-200">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Support</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {['Contact Center', 'API Documentation', 'Developer Guides', 'Platform Status'].map((item) => (
              <li key={item}>
                <a href="/" className="hover:text-white transition duration-200">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {['Privacy Policy', 'Terms of Service', 'Cookie Settings', 'Security Shield'].map((item) => (
              <li key={item}>
                <a href="/" className="hover:text-white transition duration-200">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 border-t border-slate-800 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} JobMate Inc. All rights reserved.</p>
        <p>Built with ❤️ for better talent matching.</p>
      </div>
    </div>
  </footer>
)

export default Footer
