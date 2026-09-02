import React, { useEffect } from "react";
import { Scale, ArrowLeft, FileCheck, ShieldAlert, Sparkles, CheckCircle2, Mail, AlertTriangle } from "lucide-react";

interface TermsOfServiceProps {
  onNavigateHome: () => void;
  onNavigatePrivacy: () => void;
  onNavigateBuilder: () => void;
}

export function TermsOfService({ onNavigateHome, onNavigatePrivacy, onNavigateBuilder }: TermsOfServiceProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = "Terms of Service | ProCVMaker";
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
            <Scale className="w-3.5 h-3.5" />
            <span>Terms of Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Last Updated: August 2026 • Governing website usage at <span className="text-indigo-400 font-mono">www.procvmaker.online</span>
          </p>
        </div>

        {/* Core Terms Body */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using <strong>ProCVMaker</strong> (located at <a href="https://www.procvmaker.online" className="text-indigo-400 hover:underline">www.procvmaker.online</a>), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p>
              If you do not agree with any part of these terms, you must discontinue the use of our services immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              2. Description of Service
            </h2>
            <p>
              ProCVMaker offers a dynamic, web-based tool suite allowing users to create, format, organize, preview, and download professional resumes and CV documents in PDF and PNG formats. The service includes optional AI-assisted writing tools, ATS-friendly templates, layout customization, and user account synchronization.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              3. User Responsibilities & Content Accuracy
            </h2>
            <p>
              You understand and agree that:
            </p>
            <ul className="space-y-2.5 list-none pl-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Accuracy of Information:</strong> You are solely responsible for the truthfulness, accuracy, and completeness of all personal information, employment records, qualifications, and claims included in your resume.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Review of AI-Generated Content:</strong> AI suggestions (summaries, polished job descriptions, skill lists) are provided as automated drafting aids. You are required to review, verify, and edit all AI suggestions before submitting documents to prospective employers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Account Security:</strong> If you use Google Authentication, you are responsible for maintaining the confidentiality of your account credentials.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">4. Intellectual Property & Ownership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">Your Resume Content</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You retain 100% ownership and intellectual property rights over the text, career details, personal data, and exported documents you create. We claim no ownership over your career history.
                </p>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">Platform & Design IP</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The software code, website designs, template layouts, visual styling, icons, algorithms, and brand assets are protected by intellectual property laws. You may not duplicate, reverse engineer, or sell our templates as a competing service.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">5. Acceptable Use Policy</h2>
            <p>
              When using the platform, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs">
              <li>Upload malicious code, viruses, or documents containing fraudulent or deceptive materials.</li>
              <li>Attempt to disrupt, overload, or bypass the security infrastructure or API rate limits of the platform.</li>
              <li>Use automated scrapers, crawlers, or extraction tools against our platform without express permission.</li>
              <li>Impersonate any person or entity in a fraudulent manner.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              6. "As-Is" Service Availability & Disclaimer of Warranties
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              ProCVMaker is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express, implied, statutory, or otherwise. We make no warranty that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>The service will meet your specific employment requirements or guarantee interviews or job offers.</li>
              <li>The website will operate completely uninterrupted, error-free, or without latency.</li>
              <li>Resume formatting will meet the proprietary parsing algorithms of every individual third-party employer.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">7. Limitation of Liability</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              To the fullest extent permitted by applicable law, in no event shall ProCVMaker, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of employment opportunities, loss of profits, or data loss) arising out of or in connection with your use of the service.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">8. Modifications to Terms</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We reserve the right to modify or replace these Terms of Service at any time. Changes become effective immediately upon posting to this page with an updated "Last Updated" timestamp. Your continued use of the platform after changes are posted constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              9. Contact & Inquiries
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              For any questions, legal inquiries, or feedback regarding these Terms of Service, please reach out to:
            </p>
            <div className="pt-2">
              <a 
                href="mailto:asadkhr39@gmail.com?subject=Terms Inquiry - ProCVMaker"
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
              href="/privacy" 
              onClick={(e) => {
                e.preventDefault();
                onNavigatePrivacy();
              }} 
              className="hover:text-white transition cursor-pointer"
            >
              Privacy Policy
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
