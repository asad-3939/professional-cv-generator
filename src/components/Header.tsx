import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, LayoutDashboard, LogIn, ArrowRight, 
  FileText, ShieldCheck, Target, Layers, User, LogOut, Settings
} from "lucide-react";
import { UserDropdown } from "./UserDropdown";

export type NavRoute = "home" | "builder" | "ats-checker" | "job-match" | "templates";

export interface HeaderProps {
  currentRoute: NavRoute | string;
  currentUser: { email: string; displayName: string; uid: string } | null;
  onNavigateHome: () => void;
  onNavigateBuilder: () => void;
  onNavigateATSChecker: () => void;
  onNavigateJobMatch: () => void;
  onNavigateTemplates?: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  primaryCtaLabel?: string;
  onPrimaryCta?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  currentUser,
  onNavigateHome,
  onNavigateBuilder,
  onNavigateATSChecker,
  onNavigateJobMatch,
  onNavigateTemplates,
  onOpenDashboard,
  onOpenSettings,
  onSignIn,
  onSignOut,
  onNavigatePrivacy,
  onNavigateTerms,
  primaryCtaLabel,
  onPrimaryCta,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change or ESC key
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTemplatesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onNavigateTemplates) {
      onNavigateTemplates();
    } else {
      const el = document.getElementById("templates");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        onNavigateHome();
        setTimeout(() => {
          document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  };

  const isRouteActive = (route: string) => {
    if (route === "templates") {
      return currentRoute === "templates";
    }
    return currentRoute === route;
  };

  return (
    <header className="h-16 md:h-20 border-b border-slate-850 px-4 md:px-8 lg:px-12 flex items-center justify-between relative z-40 bg-slate-950">
      {/* 1. Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <a 
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setIsMobileMenuOpen(false);
            onNavigateHome();
          }}
          className="flex items-center gap-3 text-left cursor-pointer group"
          id="header_brand_logo_link"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center font-black text-white text-md shadow-xl shadow-teal-500/15 shrink-0 group-hover:scale-105 transition-transform">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">ProCVMaker</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">AI CV Builder &amp; ATS Resume Checker</p>
          </div>
        </a>
      </div>

      {/* 2. Middle: Desktop Navigation (Crawlable <a> links with subtle active state) */}
      <nav 
        className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold"
        aria-label="Main Navigation"
      >
        {/* CV Builder */}
        <a 
          href="/builder"
          onClick={(e) => {
            e.preventDefault();
            onNavigateBuilder();
          }}
          className={`px-3 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            isRouteActive("builder")
              ? "text-teal-300 font-bold bg-teal-950/50 border border-teal-800/50 shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-900/80"
          }`}
          id="header_nav_builder_link"
        >
          {isRouteActive("builder") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
          <span>CV Builder</span>
        </a>

        {/* ATS Checker */}
        <a 
          href="/ats-checker"
          onClick={(e) => {
            e.preventDefault();
            onNavigateATSChecker();
          }}
          className={`px-3 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            isRouteActive("ats-checker")
              ? "text-teal-300 font-bold bg-teal-950/50 border border-teal-800/50 shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-900/80"
          }`}
          id="header_nav_ats_checker_link"
        >
          {isRouteActive("ats-checker") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
          <span>ATS Checker</span>
        </a>

        {/* Job Match */}
        <a 
          href="/job-match"
          onClick={(e) => {
            e.preventDefault();
            onNavigateJobMatch();
          }}
          className={`px-3 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            isRouteActive("job-match")
              ? "text-teal-300 font-bold bg-teal-950/50 border border-teal-800/50 shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-900/80"
          }`}
          id="header_nav_job_match_link"
        >
          {isRouteActive("job-match") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
          <span>Job Match</span>
        </a>

        {/* Templates */}
        <a 
          href="/#templates"
          onClick={handleTemplatesClick}
          className={`px-3 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            isRouteActive("templates")
              ? "text-teal-300 font-bold bg-teal-950/50 border border-teal-800/50 shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-900/80"
          }`}
          id="header_nav_templates_link"
        >
          {isRouteActive("templates") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
          <span>Templates</span>
        </a>
      </nav>

      {/* 3. Right: Account Actions & Primary CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentUser ? (
          <>
            {/* My CVs Quick Link (Logged-in user) */}
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer"
                title="View your saved CVs and drafts"
                id="header_my_cvs_btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                <span>My CVs</span>
              </button>
            )}

            {/* Profile / Account Dropdown */}
            <UserDropdown
              currentUser={currentUser}
              onOpenDashboard={onOpenDashboard || onNavigateBuilder}
              onOpenSettings={onOpenSettings || onOpenDashboard || onNavigateBuilder}
              onSignOut={onSignOut}
              onNavigatePrivacy={onNavigatePrivacy}
              onNavigateTerms={onNavigateTerms}
            />
          </>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl text-xs font-semibold transition cursor-pointer border border-transparent hover:border-slate-800"
            id="header_signin_btn"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign In</span>
          </button>
        )}

        {/* Primary CTA (CV Editor / Create CV) */}
        <a
          href="/builder"
          onClick={(e) => {
            e.preventDefault();
            if (onPrimaryCta) {
              onPrimaryCta();
            } else {
              onNavigateBuilder();
            }
          }}
          className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-teal-500/20 cursor-pointer shrink-0"
          id="header_primary_cta_btn"
        >
          <span>{primaryCtaLabel || (currentRoute === "builder" ? "CV Editor" : "Open CV Editor")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition cursor-pointer border border-slate-800/80"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          id="header_mobile_menu_toggle"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-teal-400" />
          ) : (
            <Menu className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* 4. Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-850 px-4 py-4 shadow-2xl z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          id="header_mobile_menu_dropdown"
        >
          {/* Mobile Nav Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1 block">
              Navigation
            </span>

            {/* CV Builder */}
            <a 
              href="/builder"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                onNavigateBuilder();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isRouteActive("builder")
                  ? "text-teal-300 font-bold bg-teal-950/60 border border-teal-800/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
              id="mobile_nav_builder_link"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>CV Builder</span>
              </div>
              {isRouteActive("builder") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </a>

            {/* ATS Checker */}
            <a 
              href="/ats-checker"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                onNavigateATSChecker();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isRouteActive("ats-checker")
                  ? "text-teal-300 font-bold bg-teal-950/60 border border-teal-800/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
              id="mobile_nav_ats_checker_link"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>ATS Checker</span>
              </div>
              {isRouteActive("ats-checker") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </a>

            {/* Job Match */}
            <a 
              href="/job-match"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                onNavigateJobMatch();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isRouteActive("job-match")
                  ? "text-teal-300 font-bold bg-teal-950/60 border border-teal-800/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
              id="mobile_nav_job_match_link"
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-teal-400" />
                <span>Job Match</span>
              </div>
              {isRouteActive("job-match") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </a>

            {/* Templates */}
            <a 
              href="/#templates"
              onClick={handleTemplatesClick}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isRouteActive("templates")
                  ? "text-teal-300 font-bold bg-teal-950/60 border border-teal-800/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
              id="mobile_nav_templates_link"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Templates</span>
              </div>
              {isRouteActive("templates") && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </a>
          </div>

          <div className="h-px bg-slate-850 my-2" />

          {/* Account & Quick Action Section */}
          <div className="space-y-1.5">
            {currentUser ? (
              <>
                <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser.displayName || "My Account"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                {onOpenDashboard && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDashboard();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition text-left cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-400" />
                    <span>My CVs</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignIn();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-semibold transition border border-slate-800 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onPrimaryCta) {
                      onPrimaryCta();
                    } else {
                      onNavigateBuilder();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <span>{primaryCtaLabel || "Open CV Editor"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
