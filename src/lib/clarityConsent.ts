export type AnalyticsConsentStatus = "granted" | "denied" | null;

export const CLARITY_CONSENT_STORAGE_KEY = "procvmaker_analytics_consent";
export const CLARITY_SCRIPT_ATTR = "data-procvmaker-clarity";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface ClarityWindowLike {
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
}

export interface ClarityInitResult {
  initialized: boolean;
  reason:
    | "initialized"
    | "already_initialized"
    | "missing_id"
    | "consent_not_granted"
    | "missing_dom";
}

function getSafeStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }
  return null;
}

export function getConfiguredClarityId(overrideId?: string): string {
  if (typeof overrideId === "string") {
    return overrideId.trim();
  }
  const envVal = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env
    ?.VITE_CLARITY_ID;
  return typeof envVal === "string" ? envVal.trim() : "";
}

export function getAnalyticsConsentStatus(storage?: StorageLike | null): AnalyticsConsentStatus {
  const store = getSafeStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(CLARITY_CONSENT_STORAGE_KEY);
    if (raw === "granted" || raw === "denied") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsentStatus(
  status: Exclude<AnalyticsConsentStatus, null>,
  storage?: StorageLike | null
): void {
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.setItem(CLARITY_CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage quota or private-browsing errors cleanly
  }
}

export function canInitializeClarity(
  clarityId: string,
  consentStatus: AnalyticsConsentStatus
): boolean {
  return Boolean(clarityId.trim()) && consentStatus === "granted";
}

export function hasClarityScript(doc: Document | null | undefined, clarityId: string): boolean {
  if (!doc) return false;
  const trimmedId = clarityId.trim();
  if (doc.querySelector(`script[${CLARITY_SCRIPT_ATTR}="true"]`)) {
    return true;
  }
  if (!trimmedId) return false;
  const expectedSrc = `https://www.clarity.ms/tag/${encodeURIComponent(trimmedId)}`;
  const scripts = Array.from(doc.querySelectorAll("script"));
  return scripts.some((s) => s.getAttribute("src") === expectedSrc);
}

export interface ClarityConsentOptions {
  clarityId?: string;
  storage?: StorageLike | null;
  doc?: Document | null;
  win?: ClarityWindowLike | null;
}

export function initializeClarityIfConsented(
  options: ClarityConsentOptions = {}
): ClarityInitResult {
  const clarityId = getConfiguredClarityId(options.clarityId);
  if (!clarityId) {
    return { initialized: false, reason: "missing_id" };
  }

  const consent = getAnalyticsConsentStatus(options.storage);
  if (!canInitializeClarity(clarityId, consent)) {
    return { initialized: false, reason: "consent_not_granted" };
  }

  const doc = options.doc !== undefined ? options.doc : typeof document !== "undefined" ? document : null;
  const win =
    options.win !== undefined
      ? options.win
      : typeof window !== "undefined"
        ? (window as unknown as ClarityWindowLike)
        : null;

  if (!doc || !win) {
    return { initialized: false, reason: "missing_dom" };
  }

  if (hasClarityScript(doc, clarityId)) {
    return { initialized: false, reason: "already_initialized" };
  }

  if (!win.clarity) {
    const queueFn = function (...args: unknown[]) {
      (queueFn.q = queueFn.q || []).push(args);
    } as ((...args: unknown[]) => void) & { q?: unknown[] };
    queueFn.q = [];
    win.clarity = queueFn;
  }

  const script = doc.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`;
  script.setAttribute(CLARITY_SCRIPT_ATTR, "true");

  const targetParent = doc.head || doc.getElementsByTagName("head")[0] || doc.body || doc.documentElement;
  if (!targetParent) {
    return { initialized: false, reason: "missing_dom" };
  }
  targetParent.appendChild(script);

  try {
    win.clarity("consent", true);
  } catch {
    // Ignore non-fatal consent signal error
  }

  return { initialized: true, reason: "initialized" };
}

export function grantClarityConsent(options: ClarityConsentOptions = {}): ClarityInitResult {
  setAnalyticsConsentStatus("granted", options.storage);
  return initializeClarityIfConsented(options);
}

export function revokeClarityConsent(options: ClarityConsentOptions = {}): void {
  setAnalyticsConsentStatus("denied", options.storage);

  const doc = options.doc !== undefined ? options.doc : typeof document !== "undefined" ? document : null;
  const win =
    options.win !== undefined
      ? options.win
      : typeof window !== "undefined"
        ? (window as unknown as ClarityWindowLike)
        : null;

  if (win?.clarity) {
    try {
      win.clarity("consent", false);
    } catch {
      // Ignore
    }
    try {
      delete win.clarity;
    } catch {
      win.clarity = undefined;
    }
  }

  if (doc) {
    const injectedScripts = Array.from(doc.querySelectorAll(`script[${CLARITY_SCRIPT_ATTR}="true"]`));
    for (const scriptEl of injectedScripts) {
      scriptEl.parentNode?.removeChild(scriptEl);
    }
  }
}
