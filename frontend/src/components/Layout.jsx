import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import ChatBot from './ChatBot';

const Layout = ({ isAdmin, setIsAdmin }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 shadow-lg">
        <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      </div>
      
      {/* Main Content with subtle background pattern */}
      <main className="flex-grow relative">
        {/* Decorative subtle pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>
        
        {/* Content container with refined styling */}
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 relative z-10">
          {/* Page content wrapper with subtle elevation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100/50   min-h-[calc(100vh-280px)]">
            <Outlet />
          </div>
        </div>
      </main>
     <ChatBot />
      {/* Footer */}
      <div className="relative z-40">
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent h-4"></div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;