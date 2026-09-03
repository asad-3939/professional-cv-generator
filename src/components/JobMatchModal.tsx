import React from "react";
import { CVData } from "../types";
import { JobMatchView } from "./jobmatch/JobMatchView";

export interface JobMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  cvTitle?: string;
  onUpdateCVData?: (newData: CVData) => void;
  initialJobDescription?: string;
}

export const JobMatchModal: React.FC<JobMatchModalProps> = ({
  isOpen,
  onClose,
  cvData,
  cvTitle = "Current Resume",
  onUpdateCVData,
  initialJobDescription = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200 font-sans">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        id="job_match_modal_container"
      >
        <JobMatchView
          cvData={cvData}
          cvTitle={cvTitle}
          onUpdateCVData={onUpdateCVData}
          initialJobDescription={initialJobDescription}
          inModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
