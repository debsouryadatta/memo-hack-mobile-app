import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-12 md:py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-8 md:gap-12">
        <div className="mb-8 md:mb-0">
          <div className="mb-6">
            <img
              src="/assets/memohack-logo.png"
              alt="MemoHack"
              className="h-16 md:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]"
            />
          </div>
          <p className="text-gray-500 text-sm md:text-base max-w-sm">
            Making Physics and Biology simple, logical, and accessible. Founded
            with a vision to bridge the gap between conceptual understanding and
            exam performance in Agartala.
          </p>
          <div className="mt-6 md:mt-8 flex gap-4">
            {/* YouTube */}
            <a 
              href="https://youtube.com/@memohack?si=EZelkhqdF-gbUUdK"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 transition-all cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-gray-400 group-hover:fill-white transition-colors">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/_memohack_?igsh=djB5cHFlZ216NXlz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 transition-all cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-gray-400 group-hover:fill-white transition-colors">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/profile.php?id=61557890293483&mibextid=rS40aB7S9Ucbxw6v"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-gray-400 group-hover:fill-white transition-colors">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:gap-12">
          <div>
            <h4 className="font-bold mb-4 md:mb-6 text-white text-base md:text-lg">
              Programs
            </h4>
            <ul className="space-y-3 md:space-y-4 text-gray-500 text-xs md:text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Physics Mastery (VIII - XII)
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Biology System (VIII - XII)
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                JEE (Main & Advanced)
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                NEET (UG)
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Olympiads & CUET
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 md:mb-6 text-white text-base md:text-lg">
              Institute
            </h4>
            <ul className="space-y-3 md:space-y-4 text-gray-500 text-xs md:text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                About Us
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Faculty
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Test Series (NRTS/JRTS)
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Contact
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 md:mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-xs md:text-sm">
        © 2026 MemoHack Institute. All rights reserved.
      </div>
    </footer>
  );
};
