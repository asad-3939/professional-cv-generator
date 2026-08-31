import React, { useState, useEffect } from "react";
import { 
  X, AlertCircle, Check, Loader2, Sparkles, Mail, Lock, 
  User, Eye, EyeOff, ArrowLeft, Chrome, CheckCircle2
} from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../lib/firebase";

export type AuthMode = "signin" | "signup" | "forgot";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onAuthSuccess: (user: { email: string; displayName: string; uid: string }) => void;
}

// Convert raw system error codes into clear, user-friendly language
function getFriendlyErrorMessage(err: any): string {
  if (!err) return "An unexpected issue occurred. Please try again.";
  
  const code = err.code || "";
  const msg = err.message || "";

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters long.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled.";
  }
  if (code === "auth/blocked-by-popup-blocker") {
    return "Google sign-in popup was blocked. Please allow popups for this site.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a few moments before trying again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network connection issue. Please check your internet connection and try again.";
  }
  
  // If the error message is clean text, return it if not exposing raw internal codes
  if (typeof msg === "string" && msg.length > 0 && !msg.includes("Firebase:") && !msg.includes("auth/")) {
    return msg;
  }
  
  return "Could not complete sign in. Please verify your details and try again.";
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  defaultMode = "signin", 
  onAuthSuccess 
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrMessage(null);
      setSuccessMessage(null);
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrMessage(null);
    setSuccessMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setSuccessMessage("Signed in with Google successfully!");
      setTimeout(() => {
        onAuthSuccess({
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          uid: user.uid
        });
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Google login notice:", err);
      setErrMessage(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email + Password Sign In / Sign Up / Forgot Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrMessage("Please enter your email address.");
      return;
    }

    // Forgot Password flow
    if (mode === "forgot") {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMessage(`Password recovery link sent to ${cleanEmail}. Check your inbox.`);
      } catch (err: any) {
        console.error("Password reset error:", err);
        setErrMessage(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Password validation for Sign In / Sign Up
    if (!password) {
      setErrMessage("Please enter your password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setErrMessage("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // If user provided name, update Firebase profile
        const targetName = fullName.trim() || cleanEmail.split("@")[0];
        try {
          await updateProfile(user, { displayName: targetName });
        } catch (profileErr) {
          console.warn("Profile name assignment error:", profileErr);
        }

        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          onAuthSuccess({
            email: user.email || cleanEmail,
            displayName: targetName,
            uid: user.uid
          });
          onClose();
        }, 700);
      } else {
        // Sign in to existing account
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        setSuccessMessage("Signed in successfully!");
        setTimeout(() => {
          onAuthSuccess({
            email: user.email || cleanEmail,
            displayName: user.displayName || cleanEmail.split("@")[0],
            uid: user.uid
          });
          onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setErrMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" 
      id="auth-modal-overlay"
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
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
        <div className="p-6 pb-2 text-left">
          {mode === "forgot" ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <h2 className="text-xl font-extrabold text-white tracking-tight" id="auth-modal-title">
                Reset your password
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Enter your account email and we'll send you a secure link to reset your password.
              </p>
            </div>
          ) : (
            <div>
              {/* Tab Selector: Sign In vs Create Account */}
              <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 mb-4 max-w-[280px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    mode === "signin"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="tab-btn-signin"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    mode === "signup"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="tab-btn-signup"
                >
                  Create Account
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight" id="auth-modal-title">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {mode === "signin"
                  ? "Sign in to access your saved CV drafts, history, and PDF downloads."
                  : "Start creating ATS-friendly, recruiter-ready resumes in minutes."}
              </p>
            </div>
          )}
        </div>

        {/* Modal Form & Google Action */}
        <div className="p-6 pt-2 space-y-4">
          
          {/* Feedback Toasts */}
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

          {/* Quick Google Sign In Button (Shown on Sign In & Sign Up) */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm select-none"
                id="auth-google-btn"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Connecting with Google...</span>
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  or with email
                </span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>
            </>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {/* Full Name (Sign Up only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl text-xs text-white placeholder:text-slate-600 transition"
                    id="auth-name-input"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl text-xs text-white placeholder:text-slate-600 transition"
                  id="auth-email-input"
                />
              </div>
            </div>

            {/* Password Field (Sign In & Sign Up only) */}
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                      id="auth-forgot-password-link"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Create a secure password (6+ chars)" : "Enter your password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl text-xs text-white placeholder:text-slate-600 transition"
                    id="auth-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me checkbox for Sign In */}
            {mode === "signin" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember-me-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/40 cursor-pointer accent-indigo-600"
                />
                <label htmlFor="remember-me-checkbox" className="text-[11px] text-slate-400 font-medium cursor-pointer select-none">
                  Keep me signed in on this device
                </label>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 mt-2"
              id="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {mode === "signin"
                      ? "Signing In..."
                      : mode === "signup"
                      ? "Creating Account..."
                      : "Sending Recovery Link..."}
                  </span>
                </>
              ) : (
                <span>
                  {mode === "signin"
                    ? "Sign In"
                    : mode === "signup"
                    ? "Create Account"
                    : "Send Recovery Email"}
                </span>
              )}
            </button>
          </form>

          {/* Quick Mode Toggle Link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 transition cursor-pointer"
                  id="switch-to-signup-btn"
                >
                  Create Account
                </button>
              </p>
            ) : mode === "signup" ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 transition cursor-pointer"
                  id="switch-to-signin-btn"
                >
                  Sign In
                </button>
              </p>
            ) : null}
          </div>

        </div>

        {/* Footer Security Notice */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 text-center">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            Protected & Encrypted Secure Sign-In
          </p>
        </div>
      </div>
    </div>
  );
}
