import React, { useState } from "react";
import { 
  X, User, Mail, Lock, Shield, Check, AlertCircle, 
  Loader2, Sparkles, LayoutDashboard, KeyRound
} from "lucide-react";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { 
    email: string; 
    displayName: string; 
    uid: string;
  } | null;
  onOpenDashboard: () => void;
  onProfileUpdated?: (newName: string) => void;
}

export function AccountSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onOpenDashboard,
  onProfileUpdated
}: AccountSettingsModalProps) {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || "");
      setStatusMessage(null);
      setIsSavingName(false);
      setIsSendingReset(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSavingName(true);
    setStatusMessage(null);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || currentUser.email.split("@")[0]
      });
      if (onProfileUpdated) {
        onProfileUpdated(displayName.trim() || currentUser.email.split("@")[0]);
      }
      setStatusMessage({
        type: "success",
        text: "Your display name has been updated successfully."
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to update profile name. Please try again."
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser.email) return;

    setIsSendingReset(true);
    setStatusMessage(null);

    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setStatusMessage({
        type: "success",
        text: `A password reset link has been sent to ${currentUser.email}. Please check your inbox.`
      });
    } catch (err: any) {
      console.error("Password reset email error:", err);
      setStatusMessage({
        type: "error",
        text: "Could not send password reset link. Please try again later."
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="account-settings-overlay">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
        id="account-settings-modal"
      >
        {/* Top Gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
          id="account-settings-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Account Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your personal details and account security
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status feedback message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              statusMessage.type === "success" 
                ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                : "bg-rose-950/40 border border-rose-800/40 text-rose-300"
            }`}>
              {statusMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Form: Profile Information */}
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl text-xs text-white placeholder:text-slate-600 transition"
                  id="settings-display-name-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed select-none"
                  id="settings-email-disabled-input"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Your email is associated with your active login credentials.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingName}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              id="settings-save-name-btn"
            >
              {isSavingName ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </form>

          {/* Password Security Section */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Password & Security</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receive a secure recovery email to reset or create your password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={isSendingReset}
              className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              id="settings-send-password-reset-btn"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending email...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Resumes Link */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Saved CVs & Exports</span>
              <span className="text-[11px] text-slate-400">View or restore previous resume versions</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDashboard();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open Dashboard</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
