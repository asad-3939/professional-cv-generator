import React, { useState } from "react";
import { 
  X, User, Mail, ShieldCheck, Check, AlertCircle, 
  Loader2, LayoutDashboard, Cloud
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || "");
      setStatusMessage(null);
      setIsSavingName(false);
    }
  }, [isOpen, currentUser]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSavingName(true);
    setStatusMessage(null);

    const trimmedName = displayName.trim() || currentUser.email.split("@")[0];

    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmedName
      });

      // Update in Firestore users doc as well
      await setDoc(doc(db, "users", currentUser.uid), {
        displayName: trimmedName
      }, { merge: true });

      if (onProfileUpdated) {
        onProfileUpdated(trimmedName);
      }
      setStatusMessage({
        type: "success",
        text: "Your profile name has been updated successfully."
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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="account-settings-overlay" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-left"
        onClick={(e) => e.stopPropagation()}
        id="account-settings-modal"
      >
        {/* Top Gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close account settings"
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
              <h2 id="account-settings-title" className="text-lg font-bold text-white tracking-tight">
                Account Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Google account profile and workspace details
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
                Display Name
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
                Google Account Email
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
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified with Google Authentication</span>
              </div>
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
                <span>Save Display Name</span>
              )}
            </button>
          </form>

          {/* Quick Resumes Link */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">My CVs Dashboard</span>
              <span className="text-[11px] text-slate-400">Manage, duplicate, and switch between your resumes</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDashboard();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open My CVs</span>
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
