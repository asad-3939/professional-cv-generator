import React, { useEffect } from "react";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { AnalyticsConsentStatus } from "../../lib/clarityConsent";

interface AnalyticsConsentBannerProps {
  consentStatus: AnalyticsConsentStatus;
  isClarityConfigured: boolean;
  isPreferencesOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClosePreferences: () => void;
  onOpenPrivacy: () => void;
}

export const AnalyticsConsentBanner: React.FC<AnalyticsConsentBannerProps> = ({
  consentStatus,
  isClarityConfigured,
  isPreferencesOpen,
  onAccept,
  onReject,
  onClosePreferences,
  onOpenPrivacy,
}) => {
  useEffect(() => {
    if (!isPreferencesOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClosePreferences();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreferencesOpen, onClosePreferences]);

  const showInitialBanner = consentStatus === null && !isPreferencesOpen;

  return (
    <>
      {showInitialBanner && (
        <aside
          role="region"
          aria-label="Analytics privacy consent"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-2xl text-left"
          id="analytics-consent-banner"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-xs font-bold text-white tracking-tight">
                Optional Usability Analytics
              </h2>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                With your consent, ProCVMaker can load Microsoft Clarity to measure aggregated interface usability. Analytics stay off until you click Accept, and you can change this anytime.{" "}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                >
                  Privacy Policy
                </button>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onAccept}
                  id="analytics-consent-accept-btn"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Accept Analytics
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  id="analytics-consent-reject-btn"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {isPreferencesOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClosePreferences}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-prefs-title"
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-left relative"
            onClick={(e) => e.stopPropagation()}
            id="analytics-preferences-modal"
          >
            <button
              type="button"
              onClick={onClosePreferences}
              aria-label="Close analytics preferences"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 id="analytics-prefs-title" className="text-sm font-bold text-white">
                  Analytics Preferences
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage optional Microsoft Clarity usability analytics
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                ProCVMaker does not load analytics scripts before explicit opt-in consent. Rejecting analytics never affects CV editing, ATS checks, job matching, or PDF exports.
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Current Preference:</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    consentStatus === "granted"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : consentStatus === "denied"
                        ? "bg-slate-800 text-slate-300 border border-slate-700"
                        : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  {consentStatus === "granted"
                    ? "Accepted"
                    : consentStatus === "denied"
                      ? "Rejected"
                      : "Not Chosen"}
                </span>
              </div>

              {!isClarityConfigured && (
                <p className="text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  Note: <code className="text-slate-300">VITE_CLARITY_ID</code> is not configured in this environment, so analytics scripts remain inactive even if accepted.
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClosePreferences();
                  onOpenPrivacy();
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
              >
                Read Privacy Policy
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onReject();
                    onClosePreferences();
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClosePreferences();
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Accept Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
