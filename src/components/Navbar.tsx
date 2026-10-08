import React, { useState } from 'react';
import { Bus, MapPin, User, LogOut, Shield, Compass, Sparkles, BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  currentTab: 'search' | 'my-bookings' | 'live-tracking' | 'admin';
  onTabChange: (tab: 'search' | 'my-bookings' | 'live-tracking' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenAuth,
  onOpenAiAssistant
}) => {
  const { user, isAuthenticated, isAdmin, isDepotManager, logout, quickDemoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const canAccessAdmin = isAdmin || isDepotManager;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            id="brand-logo-btn"
            onClick={() => { onTabChange('search'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">SmartBus</span>
                <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-md tracking-wider">AI</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">
                Intelligent KSRTC Reservation Demo
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-search-btn"
              onClick={() => onTabChange('search')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'search'
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              Book Ticket
            </button>

            <button
              id="nav-tracking-btn"
              onClick={() => onTabChange('live-tracking')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'live-tracking'
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Live Tracking
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {isAuthenticated && (
              <button
                id="nav-bookings-btn"
                onClick={() => onTabChange('my-bookings')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'my-bookings'
                    ? 'bg-red-50 text-red-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                My Bookings
              </button>
            )}

            {canAccessAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => onTabChange('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-red-700 text-white'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                {isDepotManager ? 'Depot Management' : 'Admin Console'}
              </button>
            )}

            <button
              id="nav-ai-btn"
              onClick={onOpenAiAssistant}
              className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center gap-1 border border-amber-300 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              AI Assistant
            </button>
          </nav>

          {/* User Auth & Quick Demo Switcher */}
          <div className="hidden md:flex items-center gap-2">
            {/* Quick Demo Selector */}
            <div className="relative">
              <button
                id="demo-switcher-btn"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 flex items-center gap-1 cursor-pointer"
                title="Quick demo profile switcher"
              >
                <span>Demo Role</span>
                <span className="text-[10px] bg-slate-300 text-slate-800 px-1 rounded">▼</span>
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    Switch Active Role
                  </div>
                  <button
                    onClick={async () => {
                      await quickDemoLogin('user');
                      setDemoMenuOpen(false);
                      onTabChange('search');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="font-semibold">Passenger</p>
                      <p className="text-[10px] text-slate-500">Ramesh Gowda (Regular)</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await quickDemoLogin('admin');
                      setDemoMenuOpen(false);
                      onTabChange('admin');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="font-semibold">System Administrator</p>
                      <p className="text-[10px] text-slate-500">All Depots & Fare Rate</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await quickDemoLogin('depot_manager_mysuru');
                      setDemoMenuOpen(false);
                      onTabChange('admin');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">M</div>
                    <div>
                      <p className="font-semibold">Mysuru Depot Manager</p>
                      <p className="text-[10px] text-slate-500">Suburban Bus Stand Fleet</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await quickDemoLogin('depot_manager_bengaluru');
                      setDemoMenuOpen(false);
                      onTabChange('admin');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-bold">B</div>
                    <div>
                      <p className="font-semibold">Bengaluru Depot Manager</p>
                      <p className="text-[10px] text-slate-500">Majestic Central Fleet</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await quickDemoLogin('driver');
                      setDemoMenuOpen(false);
                      onTabChange('live-tracking');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">D</div>
                    <div>
                      <p className="font-semibold">Bus Driver / Pilot</p>
                      <p className="text-[10px] text-slate-500">GPS & Telemetry Cockpit</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                      {user?.role?.toLowerCase() === 'depot_manager' ? 'Depot Mgr' : user?.role}
                    </span>
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="login-modal-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Login
                </button>
                <button
                  id="register-modal-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-1.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs shadow-red-600/20 transition-all hover:shadow-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenAiAssistant}
              className="p-1.5 rounded-lg bg-amber-100 text-amber-800"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => { onTabChange('search'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentTab === 'search' ? 'bg-red-50 text-red-700' : 'text-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" /> Book Ticket
          </button>
          <button
            onClick={() => { onTabChange('live-tracking'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentTab === 'live-tracking' ? 'bg-red-50 text-red-700' : 'text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" /> Live Driver Tracking
          </button>
          {isAuthenticated && (
            <button
              onClick={() => { onTabChange('my-bookings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                currentTab === 'my-bookings' ? 'bg-red-50 text-red-700' : 'text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" /> My Bookings
            </button>
          )}
          {canAccessAdmin && (
            <button
              onClick={() => { onTabChange('admin'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                currentTab === 'admin' ? 'bg-red-700 text-white' : 'text-red-700'
              }`}
            >
              <Shield className="w-4 h-4" /> {isDepotManager ? 'Depot Management' : 'Admin Console'}
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-xs font-semibold text-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-sm font-bold text-white bg-red-600 rounded-lg text-center"
                >
                  Register
                </button>
              </div>
            )}
            {/* Quick demo buttons for mobile */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  await quickDemoLogin('user');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-1.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md text-center"
              >
                Demo Passenger
              </button>
              <button
                onClick={async () => {
                  await quickDemoLogin('admin');
                  setMobileMenuOpen(false);
                  onTabChange('admin');
                }}
                className="flex-1 py-1.5 text-[11px] font-semibold bg-red-50 text-red-700 rounded-md text-center"
              >
                Demo Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
