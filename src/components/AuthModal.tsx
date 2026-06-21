import React, { useState } from "react";
import { 
  X, Mail, Lock, Eye, EyeOff, AlertCircle, Check, Loader2, Sparkles
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onAuthSuccess: (user: { email: string; displayName: string; uid: string }) => void;
}

export function AuthModal({ isOpen, onClose, defaultTab = "login", onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMessage(null);
    setSuccessMessage(null);

    // Validate email
    if (!email.trim() || !email.includes("@")) {
      setErrMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setErrMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        
        // Register new user on safe Express API
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim()
          })
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to register account.");
        }

        setSuccessMessage("Registered successfully! Welcome to AI Professional CV Builder.");
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 1200);

      } else {
        // Log in user on safe Express API
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Incorrect email or password. Please try again.");
        }

        setSuccessMessage("Signed in successfully!");
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      setErrMessage(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="auth-modal-overlay">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
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
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">MEMBERS ONLY</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight" id="auth-modal-title">
            {activeTab === "login" ? "Sign in to Download" : "Create Professional Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register or sign in with email to export high-quality interactive CV/Resume files in PDF and PNG.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="px-6 flex border-b border-slate-800/60" id="auth-tabs">
          <button
            onClick={() => {
              setActiveTab("login");
              setErrMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer select-none ${
              activeTab === "login" 
                ? "border-indigo-500 text-white" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            id="tab-login"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setErrMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer select-none ${
              activeTab === "register" 
                ? "border-indigo-500 text-white" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            id="tab-register"
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAuth} className="p-6 space-y-4">
          {errMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs shadow-inner animate-pulse" id="auth-error-display">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <span>{errMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs shadow-inner" id="auth-success-display">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === "register" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="e.g. Asad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-white rounded-lg text-xs outline-none transition"
                  id="auth-fullname-input"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-white rounded-lg text-xs outline-none transition"
                id="auth-email-input"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-white rounded-lg text-xs outline-none transition"
                id="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                id="auth-password-toggle-btn"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {activeTab === "register" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-white rounded-lg text-xs outline-none transition"
                  id="auth-confirm-password-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-extrabold tracking-tight cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            id="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{activeTab === "login" ? "Sign In & Download" : "Create Account & Download"}</span>
            )}
          </button>
        </form>

        {/* Bottom Switch text */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/40 text-center">
          <p className="text-xs text-slate-500">
            {activeTab === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setActiveTab(activeTab === "login" ? "register" : "login");
                setErrMessage(null);
                setSuccessMessage(null);
              }}
              className="text-indigo-400 font-bold hover:underline cursor-pointer"
              id="auth-toggle-link"
            >
              {activeTab === "login" ? "Create professional account" : "Login to your account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
