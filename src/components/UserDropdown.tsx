import React, { useState, useRef, useEffect } from "react";
import { 
  User, LayoutDashboard, Settings, LogOut, ChevronDown, 
  Shield, FileText, Sparkles, Check
} from "lucide-react";

interface UserDropdownProps {
  currentUser: { 
    email: string; 
    displayName: string; 
    uid: string;
    photoURL?: string | null;
  };
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
}

export function UserDropdown({
  currentUser,
  onOpenDashboard,
  onOpenSettings,
  onSignOut,
  onNavigatePrivacy,
  onNavigateTerms
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const initials = currentUser.displayName
    ? currentUser.displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : currentUser.email.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="user-dropdown-container">
      {/* User Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="user-profile-menu-button"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0">
          {initials}
        </div>

        {/* Name / Email summary */}
        <div className="hidden sm:flex flex-col text-left max-w-[120px] md:max-w-[150px]">
          <span className="text-xs font-bold text-white truncate leading-tight">
            {currentUser.displayName || "Account"}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate">
            {currentUser.email}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Modern SaaS Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 origin-top-right bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800/60"
          role="menu"
          id="user-dropdown-menu"
        >
          {/* User Header Section */}
          <div className="px-3.5 py-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.displayName || "My Account"}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>
            
            <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 bg-indigo-950/60 border border-indigo-800/40 rounded-lg text-[10px] font-semibold text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Full Access • Free Plan</span>
            </div>
          </div>

          {/* Primary User Actions */}
          <div className="py-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer text-left"
              role="menuitem"
              id="menu-saved-cvs"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>My Saved CVs</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer text-left"
              role="menuitem"
              id="menu-account-settings"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Account Settings</span>
            </button>
          </div>

          {/* Secondary Legal Navigation */}
          {(onNavigatePrivacy || onNavigateTerms) && (
            <div className="py-1.5 space-y-0.5">
              {onNavigatePrivacy && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigatePrivacy();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition cursor-pointer text-left"
                  role="menuitem"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              )}
              {onNavigateTerms && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateTerms();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition cursor-pointer text-left"
                  role="menuitem"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Terms of Service</span>
                </button>
              )}
            </div>
          )}

          {/* Sign Out Button */}
          <div className="p-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition cursor-pointer text-left"
              role="menuitem"
              id="menu-sign-out"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
