import React, { useState } from "react";
import { 
  X, AlertCircle, Check, Loader2, Sparkles, Chrome
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onAuthSuccess: (user: { email: string; displayName: string; uid: string }) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear messages and loading state whenever the modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setErrMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrMessage(null);
    setSuccessMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setSuccessMessage("Successfully signed in with Google!");
      setTimeout(() => {
        onAuthSuccess({
          email: user.email || "",
          displayName: user.displayName || user.email || "Google User",
          uid: user.uid
        });
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrMessage("Google login popup was closed before completion.");
      } else if (err.code === "auth/blocked-by-popup-blocker") {
        setErrMessage("Google login popup was blocked. Please enable popups or open in a new tab.");
      } else {
        setErrMessage(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="auth-modal-overlay">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal"
      >
        {/* Header Decorator gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-400" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Close"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Introduction */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">ACCESS REQUIRED</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight" id="auth-modal-title">
            Sign in with Google
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Please authenticate using Google to safely save your resume, sync design presets across devices, and download high-resolution PDF or PNG layouts.
          </p>
        </div>

        {/* Inner Content Body */}
        <div className="p-6 pt-2 space-y-4">
          {errMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs shadow-inner animate-pulse" id="auth-error-display">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <span className="leading-tight">{errMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs shadow-inner animate-fade-in" id="auth-success-display">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span className="leading-tight">{successMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 hover:scale-[1.01] active:scale-98 rounded-xl text-sm font-bold transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-white/5"
            id="auth-google-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5 text-indigo-600" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info text */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/40 text-center">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Secured by Firebase Google Sign-In
          </p>
        </div>
      </div>
    </div>
  );
}
