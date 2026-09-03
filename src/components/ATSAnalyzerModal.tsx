import React from "react";
import { CVData, DesignConfig } from "../types";
import { ATSAnalyzerView } from "./ats/ATSAnalyzerView";

export interface ATSAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  designConfig?: DesignConfig;
  cvTitle?: string;
  onUpdateCVData?: (newData: CVData) => void;
  onOpenJobMatch?: () => void;
}

export const ATSAnalyzerModal: React.FC<ATSAnalyzerModalProps> = ({
  isOpen,
  onClose,
  cvData,
  designConfig,
  cvTitle = "Current Resume",
  onUpdateCVData,
  onOpenJobMatch
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        id="ats_analyzer_modal_container"
      >
        <ATSAnalyzerView
          cvData={cvData}
          designConfig={designConfig}
          cvTitle={cvTitle}
          onUpdateCVData={onUpdateCVData}
          onOpenJobMatch={onOpenJobMatch}
          inModal={true}
          onClose={onClose}
          autoRun={true}
        />
      </div>
    </div>
  );
};
