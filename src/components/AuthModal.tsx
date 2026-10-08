import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { login, register, quickDemoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = async (role: 'user' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      await quickDemoLogin(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed demo login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-amber-600 p-6 text-white relative">
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-md">
              KSRTC Demo Portal
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-red-100 text-xs mt-1">
            {mode === 'login'
              ? 'Sign in to access your digital tickets & trip history'
              : 'Join SmartBus AI for rapid bus bookings from any village'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5">
          <button
            id="auth-tab-login"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-register"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gowda"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="register-phone-input"
                      type="tel"
                      required
                      placeholder="+91 98450 12345"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to SmartBus' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Instant One-Click Demo Access (Role Based)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="demo-user-fill-btn"
                type="button"
                onClick={() => fillDemo('user')}
                className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                  Passenger
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">user@smartbus.ai</p>
              </button>

              <button
                id="demo-admin-fill-btn"
                type="button"
                onClick={() => fillDemo('admin')}
                className="p-2 border border-slate-200 hover:border-red-300 hover:bg-red-50/50 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  System Admin
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">admin@smartbus.ai</p>
              </button>

              <button
                id="demo-mysuru-manager-fill-btn"
                type="button"
                onClick={() => fillDemo('depot_manager_mysuru' as any)}
                className="p-2 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Mysuru Depot Mgr
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">manager.mysuru@smartbus.ai</p>
              </button>

              <button
                id="demo-driver-fill-btn"
                type="button"
                onClick={() => fillDemo('driver' as any)}
                className="p-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Bus Driver / Pilot
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">driver@smartbus.ai</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
