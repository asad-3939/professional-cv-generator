import React, { useEffect } from "react";
import { Shield, ArrowLeft, Lock, FileText, Sparkles, Database, Mail, CheckCircle2 } from "lucide-react";

interface PrivacyPolicyProps {
  onNavigateHome: () => void;
  onNavigateTerms: () => void;
  onNavigateBuilder: () => void;
}

export function PrivacyPolicy({ onNavigateHome, onNavigateTerms, onNavigateBuilder }: PrivacyPolicyProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = "Privacy Policy | ProCVMaker";
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <a 
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-sm shadow-md group-hover:scale-105 transition-transform">
            AI
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">ProCVMaker</span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </a>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateBuilder();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Back to Builder</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16 text-left">
        {/* Header Title Section */}
        <div className="mb-10 pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal & Privacy Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Last Updated: August 2026 • Effective for all users of <span className="text-indigo-400 font-mono">www.procvmaker.online</span>
          </p>
        </div>

        {/* Introduction */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              1. Our Privacy Commitment
            </h2>
            <p>
              At <strong>ProCVMaker</strong> (accessible at <a href="https://www.procvmaker.online" className="text-indigo-400 hover:underline">www.procvmaker.online</a>), we prioritize the confidentiality, privacy, and integrity of your career data. We believe your career journey belongs solely to you.
            </p>
            <p>
              This Privacy Policy explains how our website handles, processes, and protects your personal information when you build, edit, preview, and download resumes and CVs through our platform.
            </p>
          </section>

          {/* Data Collection */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              2. Information We Process
            </h2>
            <p>
              Depending on how you use the platform, we process the following types of information:
            </p>
            <ul className="space-y-2.5 list-none pl-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Resume & Career Details:</strong> Personal contact info (name, email, phone, location, LinkedIn/GitHub URLs), executive summaries, employment history, education, skills, certifications, and portfolio links entered into the resume builder.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Uploaded Documents:</strong> When you use our Resume Import feature, uploaded PDF, DOCX, or text files are parsed to populate fields in your chosen resume template.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Google Account Details (Optional Sign-In):</strong> If you authenticate using Google Sign-In, we receive your Google display name, email address, and unique user identifier to securely link your saved resume drafts and export history to your account.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Design Preferences:</strong> Selected template configurations, theme accent colors, font typography choices, and spacing scales.</span>
              </li>
            </ul>
          </section>

          {/* Data Storage & Handling */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              3. Data Storage & Local Persistence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">Local Browser Storage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your active draft and styling presets are saved directly inside your browser's local storage (<code className="text-slate-300">localStorage</code>), ensuring your unsaved changes persist across tab refreshes without requiring a remote server connection.
                </p>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-teal-400">Cloud Account Storage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When you sign in with Google, your resume snapshots and export versions are stored securely in Google Cloud Firebase Firestore with strict access control rules restricted exclusively to your authenticated user account.
                </p>
              </div>
            </div>
          </section>

          {/* AI Processing */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              4. AI Assistant & LLM Processing
            </h2>
            <p>
              Our application offers smart writing assistance (such as bullet point polishers, automated summary writers, skill recommendations, and resume file parsers) powered by Google Gemini AI models.
            </p>
            <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-indigo-200">Our Strict AI Privacy Principles:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Your data is transmitted securely over HTTPS solely to generate the requested text or parse uploaded resume files.</li>
                <li><strong>We do NOT sell, rent, or monetize your resume data to any third-party advertisers or brokers.</strong></li>
                <li>Your private CV inputs are NOT used to train public machine learning foundation models.</li>
              </ul>
            </div>
          </section>

          {/* Cookies and Analytics */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">5. Cookies & Session Tokens</h2>
            <p>
              We use minimal, strictly necessary cookies and browser tokens for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>Preserving authentication state during active sign-in sessions with Firebase Google Auth.</li>
              <li>Storing user interface preferences (such as template zoom scale and theme settings).</li>
            </ul>
            <p className="text-xs text-slate-400">
              We do not deploy intrusive third-party cross-site advertising or tracking cookies.
            </p>
          </section>

          {/* User Rights & Deletion */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">6. Your Data Rights & Deletion</h2>
            <p>
              You maintain absolute control over your career records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs">
              <li><strong>Local Draft Reset:</strong> You can clear your browser's stored draft anytime using the "Reset Draft" button in the editor.</li>
              <li><strong>Export Deletion:</strong> You can delete any individual saved export snapshot directly inside the User Dashboard.</li>
              <li><strong>Full Account Deletion:</strong> You can request a complete wipe of your cloud account and stored snapshots by emailing our team.</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              7. Contacting Us
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you have any questions, concerns, or data requests regarding this Privacy Policy, please contact our support team at:
            </p>
            <div className="pt-2">
              <a 
                href="mailto:asadkhr39@gmail.com?subject=Privacy Inquiry - ProCVMaker"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>asadkhr39@gmail.com</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-slate-850 bg-slate-950 px-4 md:px-8 py-8 text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ProCVMaker. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }} 
              className="hover:text-white transition cursor-pointer"
            >
              Home
            </a>
            <a 
              href="/terms" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateTerms();
              }} 
              className="hover:text-white transition cursor-pointer"
            >
              Terms of Service
            </a>
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateBuilder();
              }} 
              className="hover:text-white transition cursor-pointer text-indigo-400 font-semibold"
            >
              Back to Builder
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
