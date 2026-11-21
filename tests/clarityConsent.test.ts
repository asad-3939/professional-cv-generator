import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLARITY_CONSENT_STORAGE_KEY,
  CLARITY_SCRIPT_ATTR,
  ClarityWindowLike,
  StorageLike,
  canInitializeClarity,
  getAnalyticsConsentStatus,
  grantClarityConsent,
  hasClarityScript,
  initializeClarityIfConsented,
  revokeClarityConsent,
} from "../src/lib/clarityConsent";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

interface MockScriptEl {
  tagName: string;
  type: string;
  async: boolean;
  src: string;
  attrs: Record<string, string>;
  parentNode: MockParent | null;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
}

interface MockParent {
  children: MockScriptEl[];
  appendChild(el: MockScriptEl): MockScriptEl;
  removeChild(el: MockScriptEl): MockScriptEl;
}

function createMockDocument(): {
  doc: Document;
  head: MockParent;
} {
  const head: MockParent = {
    children: [],
    appendChild(el: MockScriptEl) {
      el.parentNode = head;
      head.children.push(el);
      return el;
    },
    removeChild(el: MockScriptEl) {
      const idx = head.children.indexOf(el);
      if (idx !== -1) head.children.splice(idx, 1);
      el.parentNode = null;
      return el;
    },
  };

  const doc = {
    head,
    createElement(tag: string): MockScriptEl {
      const el: MockScriptEl = {
        tagName: tag.toUpperCase(),
        type: "",
        async: false,
        src: "",
        attrs: {},
        parentNode: null,
        setAttribute(name: string, value: string) {
          el.attrs[name] = value;
        },
        getAttribute(name: string) {
          if (name === "src") return el.src || null;
          return el.attrs[name] ?? null;
        },
      };
      return el;
    },
    querySelector(selector: string) {
      if (selector.includes(CLARITY_SCRIPT_ATTR)) {
        return head.children.find((c) => c.attrs[CLARITY_SCRIPT_ATTR] === "true") || null;
      }
      return null;
    },
    querySelectorAll(selector: string) {
      if (selector.includes(CLARITY_SCRIPT_ATTR)) {
        return head.children.filter((c) => c.attrs[CLARITY_SCRIPT_ATTR] === "true");
      }
      if (selector === "script") {
        return [...head.children];
      }
      return [];
    },
    getElementsByTagName(name: string) {
      if (name === "head") return [head];
      return [];
    },
  } as unknown as Document;

  return { doc, head };
}

describe("Microsoft Clarity Consent Manager", () => {
  const SAMPLE_ID = "testclarity123";

  it("does not initialize Clarity or inject script when consent is undecided", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    const result = initializeClarityIfConsented({
      clarityId: SAMPLE_ID,
      storage,
      doc,
      win,
    });

    expect(result).toEqual({ initialized: false, reason: "consent_not_granted" });
    expect(getAnalyticsConsentStatus(storage)).toBeNull();
    expect(head.children).toHaveLength(0);
    expect(win.clarity).toBeUndefined();
  });

  it("initializes Clarity script and persists consent when accepted", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    const result = grantClarityConsent({
      clarityId: SAMPLE_ID,
      storage,
      doc,
      win,
    });

    expect(result).toEqual({ initialized: true, reason: "initialized" });
    expect(getAnalyticsConsentStatus(storage)).toBe("granted");
    expect(storage.getItem(CLARITY_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(head.children).toHaveLength(1);
    expect(head.children[0].async).toBe(true);
    expect(head.children[0].src).toBe(`https://www.clarity.ms/tag/${SAMPLE_ID}`);
    expect(head.children[0].getAttribute(CLARITY_SCRIPT_ATTR)).toBe("true");
    expect(typeof win.clarity).toBe("function");
    expect(win.clarity?.q).toEqual([["consent", true]]);
  });

  it("keeps Clarity disabled and blocked when consent is rejected", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    revokeClarityConsent({
      clarityId: SAMPLE_ID,
      storage,
      doc,
      win,
    });

    expect(getAnalyticsConsentStatus(storage)).toBe("denied");
    expect(canInitializeClarity(SAMPLE_ID, "denied")).toBe(false);

    const retry = initializeClarityIfConsented({
      clarityId: SAMPLE_ID,
      storage,
      doc,
      win,
    });

    expect(retry).toEqual({ initialized: false, reason: "consent_not_granted" });
    expect(head.children).toHaveLength(0);
    expect(win.clarity).toBeUndefined();
  });

  it("never initializes Clarity when VITE_CLARITY_ID is absent, even if consent is granted", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    const result = grantClarityConsent({
      clarityId: "",
      storage,
      doc,
      win,
    });

    expect(result).toEqual({ initialized: false, reason: "missing_id" });
    expect(getAnalyticsConsentStatus(storage)).toBe("granted");
    expect(head.children).toHaveLength(0);
    expect(win.clarity).toBeUndefined();

    const whitespaceResult = initializeClarityIfConsented({
      clarityId: "   ",
      storage,
      doc,
      win,
    });
    expect(whitespaceResult).toEqual({ initialized: false, reason: "missing_id" });
  });

  it("handles changing preferences from Accept -> Reject -> Accept cleanly", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    // 1. Accept
    const r1 = grantClarityConsent({ clarityId: SAMPLE_ID, storage, doc, win });
    expect(r1.initialized).toBe(true);
    expect(head.children).toHaveLength(1);

    // 2. Withdraw / Reject
    revokeClarityConsent({ clarityId: SAMPLE_ID, storage, doc, win });
    expect(getAnalyticsConsentStatus(storage)).toBe("denied");
    expect(head.children).toHaveLength(0);
    expect(win.clarity).toBeUndefined();

    // Subsequent initialization attempt must remain blocked
    const rBlocked = initializeClarityIfConsented({ clarityId: SAMPLE_ID, storage, doc, win });
    expect(rBlocked).toEqual({ initialized: false, reason: "consent_not_granted" });

    // 3. Re-accept
    const r2 = grantClarityConsent({ clarityId: SAMPLE_ID, storage, doc, win });
    expect(r2).toEqual({ initialized: true, reason: "initialized" });
    expect(head.children).toHaveLength(1);
    expect(typeof win.clarity).toBe("function");
  });

  it("prevents duplicate Clarity script injection across repeated calls", () => {
    const storage = createMemoryStorage();
    const { doc, head } = createMockDocument();
    const win: ClarityWindowLike = {};

    const first = grantClarityConsent({ clarityId: SAMPLE_ID, storage, doc, win });
    const second = initializeClarityIfConsented({ clarityId: SAMPLE_ID, storage, doc, win });
    const third = grantClarityConsent({ clarityId: SAMPLE_ID, storage, doc, win });

    expect(first).toEqual({ initialized: true, reason: "initialized" });
    expect(second).toEqual({ initialized: false, reason: "already_initialized" });
    expect(third).toEqual({ initialized: false, reason: "already_initialized" });
    expect(hasClarityScript(doc, SAMPLE_ID)).toBe(true);
    expect(head.children).toHaveLength(1);
  });

  it("ensures index.html does not contain hardcoded Clarity tracking scripts", () => {
    const html = fs.readFileSync(path.resolve("index.html"), "utf8");
    expect(html).not.toContain("clarity.ms/tag/");
    expect(html).not.toContain("ycgiai747y");
  });
});
