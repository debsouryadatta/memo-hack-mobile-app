import React from 'react';
import { Reveal } from './ui/Reveal';
import { ExternalLink } from 'lucide-react';

interface SocialLink {
  name: string;
  handle: string;
  url: string;
  color: string;
  hoverColor: string;
  bgColor: string;
  icon: React.ReactNode;
}

const socialLinks: SocialLink[] = [
  {
    name: 'YouTube',
    handle: '@MemoHack',
    url: 'https://youtube.com/@memohack?si=EZelkhqdF-gbUUdK',
    color: 'text-red-400',
    hoverColor: 'group-hover:text-red-300',
    bgColor: 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20 group-hover:border-red-500/40',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-8 md:h-8" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    name: 'Instagram',
    handle: '@memohack.in',
    url: 'https://www.instagram.com/_memohack_?igsh=djB5cHFlZ216NXlz',
    color: 'text-pink-400',
    hoverColor: 'group-hover:text-pink-300',
    bgColor: 'bg-pink-500/10 border-pink-500/20 group-hover:bg-pink-500/20 group-hover:border-pink-500/40',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-8 md:h-8" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    )
  },
  {
    name: 'Facebook',
    handle: 'MemoHack Institute',
    url: 'https://www.facebook.com/profile.php?id=61557890293483&mibextid=rS40aB7S9Ucbxw6v',
    color: 'text-blue-400',
    hoverColor: 'group-hover:text-blue-300',
    bgColor: 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-8 md:h-8" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  }
];

export const SocialMedia: React.FC = () => {
  return (
    <section className="py-8 md:py-24 px-4 md:px-4 relative overflow-hidden bg-[#020420]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[80px]"></div>
        
        {/* Connection lines pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="social-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="currentColor" className="text-white"/>
            <line x1="10" y1="10" x2="20" y2="20" stroke="currentColor" strokeWidth="0.2" className="text-indigo-500"/>
            <line x1="10" y1="10" x2="0" y2="20" stroke="currentColor" strokeWidth="0.2" className="text-indigo-500"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#social-pattern)"/>
        </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <Reveal width="100%" className="text-center mb-6 md:mb-16">
          <h2 className="text-xl md:text-5xl font-display font-extrabold mb-2 md:mb-6 tracking-tight">
            Connect With <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Us</span>
          </h2>
          <p className="text-gray-400 text-xs md:text-lg max-w-xl mx-auto">
            Follow us on social media for study tips, updates, and exclusive content
          </p>
        </Reveal>

        {/* Social Cards Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {socialLinks.map((social, index) => (
            <Reveal key={social.name} delay={index * 0.1} width="100%">
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative overflow-hidden rounded-lg md:rounded-3xl bg-[#0a0b1e]/80 border border-white/5 p-2 md:p-8 hover:border-white/10 transition-all duration-300 hover:transform hover:scale-[1.02]">
                  {/* Background Glow on Hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    social.name === 'YouTube' ? 'bg-red-500/5' :
                    social.name === 'Instagram' ? 'bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5' :
                    'bg-blue-500/5'
                  }`}></div>

                  {/* HUD Corners - Hidden on mobile */}
                  <div className={`hidden md:block absolute top-2 left-2 w-2 h-2 border-t border-l transition-colors ${
                    social.name === 'YouTube' ? 'border-red-500/30 group-hover:border-red-400/50' :
                    social.name === 'Instagram' ? 'border-pink-500/30 group-hover:border-pink-400/50' :
                    'border-blue-500/30 group-hover:border-blue-400/50'
                  }`}></div>
                  <div className={`hidden md:block absolute top-2 right-2 w-2 h-2 border-t border-r transition-colors ${
                    social.name === 'YouTube' ? 'border-red-500/30 group-hover:border-red-400/50' :
                    social.name === 'Instagram' ? 'border-pink-500/30 group-hover:border-pink-400/50' :
                    'border-blue-500/30 group-hover:border-blue-400/50'
                  }`}></div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-8 h-8 md:w-16 md:h-16 rounded-md md:rounded-2xl ${social.bgColor} border flex items-center justify-center ${social.color} ${social.hoverColor} transition-all duration-300 mb-1.5 md:mb-6`}>
                      {social.icon}
                    </div>

                    {/* Platform Name */}
                    <h3 className="text-[10px] md:text-xl font-display font-bold text-white mb-0 md:mb-1 group-hover:text-white/90 transition-colors leading-tight">
                      {social.name}
                    </h3>

                    {/* Handle - Hidden on mobile */}
                    <p className={`hidden md:block text-sm ${social.color} ${social.hoverColor} font-medium transition-colors`}>
                      {social.handle}
                    </p>

                    {/* Follow Link - Hidden on mobile */}
                    <div className="hidden md:flex mt-6 items-center gap-2 text-gray-500 group-hover:text-white/70 transition-colors">
                      <span className="text-sm font-medium">Follow</span>
                      <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Decorative Background Icon - Hidden on mobile */}
                  <div className={`hidden md:block absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${social.color}`}>
                    <div className="w-40 h-40">
                      {social.icon}
                    </div>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Bottom Decorative Element */}
        <Reveal delay={0.4} width="100%">
          <div className="mt-10 md:mt-16 flex items-center justify-center gap-4">
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/10"></div>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500/50"></div>
            </div>
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/10"></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
