import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Crown, ShieldCheck, UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogleCredential, loginDemoUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSuccess = (response: { credential?: string }) => {
    if (response.credential) {
      const ok = loginWithGoogleCredential(response.credential);
      if (!ok) {
        setErrorMsg('Could not verify Google credentials. Please try again.');
      }
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google Sign-In was cancelled or origin not authorized. You may also use the instant guest pass below.');
  };

  return (
    <div className="min-h-screen bg-[#08090e] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle luxury ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0e1017] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 text-center">
        {/* Crown & Branding */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfc46e]/20 to-[#997d21]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto mb-6 shadow-md shadow-[#d4af37]/5">
          <Crown className="w-7 h-7 stroke-[1.8]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#d4af37] text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">
          <span>Private Member Lounge</span>
        </div>

        <h1 className="font-luxury text-2xl sm:text-3xl font-bold text-white tracking-wider mb-2">
          POISA BORBAAD
        </h1>
        <p className="text-xs text-slate-400 font-light leading-relaxed mb-8">
          Sign in with your verified Google account to access your private salon wallet, demo credits, and game ledger.
        </p>

        {/* Member Guarantees */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-[#090a0f] border border-white/[0.05] text-left text-xs mb-8">
          <div className="flex items-center gap-2.5 text-slate-300">
            <UserCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span className="font-light text-[11px]">Unique account per Google profile (prevents duplicates)</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span className="font-light text-[11px]">₹500 demo credits credited upon initial arrival</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span className="font-light text-[11px]">Personalized bet history & VIP tier progress saved</span>
          </div>
        </div>

        {/* Google OAuth Button Container */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              width="280"
            />
          </div>

          {errorMsg && (
            <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fallback / Instant Guest Member Entry for local preview */}
          <div className="w-full pt-4 mt-2 border-t border-white/[0.06]">
            <button
              onClick={() => loginDemoUser('VIP Player', 'player@poisaborbaad.vip')}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 text-xs font-medium border border-white/10 hover:border-[#d4af37]/40 transition flex items-center justify-center gap-2"
            >
              <span>Instant VIP Guest Pass</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-[10px] text-slate-500 font-light">
          Encrypted authentication • Verified Google Identity
        </div>
      </div>
    </div>
  );
};
