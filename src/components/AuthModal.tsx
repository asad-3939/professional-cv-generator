import React, { useState } from "react";
import { 
  X, AlertCircle, Loader2, Sparkles, CheckCircle2, ShieldCheck, Cloud, FileText
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { syncUserProfile } from "../lib/cvService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { email: string; displayName: string; uid: string }) => void;
}

function getFriendlyErrorMessage(err: any): string {
  if (!err) return "An unexpected issue occurred. Please try again.";
  
  const code = err.code || "";
  const msg = typeof err.message === "string" ? err.message : "";

  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled.";
  }
  if (code === "auth/blocked-by-popup-blocker") {
    return "Sign-in popup was blocked. Please allow popups in your browser to sign in.";
  }
  if (code === "auth/network-request-failed" || msg.toLowerCase().includes("offline") || msg.toLowerCase().includes("network")) {
    return "We couldn't connect to the database. Please check your connection and try again.";
  }
  if (code === "auth/cancelled-popup-request") {
    return "A previous sign-in attempt was in progress. Please try again.";
  }
  
  // Never expose raw JSON strings or internal auth stack traces to users
  if (msg.startsWith("{") && msg.endsWith("}")) {
    return "We couldn't connect to the database. Please check your connection and try again.";
  }
  
  if (msg.length > 0 && !msg.includes("Firebase:") && !msg.includes("auth/")) {
    return msg;
  }
  
  return "Could not complete sign in. Please try again.";
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess 
}: AuthModalProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrMessage(null);
    setSuccessMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userData = {
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        uid: user.uid,
      };

      // Sync user profile to Firestore (background safe)
      syncUserProfile(userData).catch((e) => {
        console.warn("Background profile sync notice:", e);
      });
      
      setSuccessMessage("Signed in with Google successfully!");
      setTimeout(() => {
        onAuthSuccess(userData);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error("Google sign-in notice:", err);
      setErrMessage(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" 
      id="auth-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal"
      >
        {/* Header Decorator Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-400" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close modal"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="p-6 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3.5 text-indigo-400">
            <Cloud className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight" id="auth-modal-title">
            Sign in to ProCVMaker
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Connect your Google account to automatically save your resumes to the cloud, download ATS-optimized PDFs, and manage multiple CVs across devices.
          </p>
        </div>

        {/* Value Highlights */}
        <div className="px-6 py-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time cloud autosave for all your CV drafts</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Manage multiple resume versions in one dashboard</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Free, unlimited high-resolution PDF & Vector exports</span>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-6 pt-4 space-y-3.5">
          {/* Feedback Messages */}
          {errMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs shadow-inner" id="auth-error-display">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span className="leading-tight">{errMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs shadow-inner" id="auth-success-display">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span className="leading-tight">{successMessage}</span>
            </div>
          )}

          {/* Primary Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md select-none"
            id="auth-google-btn"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-900">Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Security Notice */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 text-center flex items-center justify-center gap-1.5 text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-[10px] font-medium uppercase tracking-wider">
            Secure Google OAuth 2.0 Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
