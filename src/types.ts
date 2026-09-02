export interface PersonalDetails {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  technologies: string;
  description: string;
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string; // e.g., Native, Fluent, Professional, Conversational
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface CVData {
  personal: PersonalDetails;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
}

export type TemplateId = 'executive' | 'minimalist' | 'creative' | 'modern';

export interface DesignConfig {
  templateId: TemplateId;
  themeColor: string; // Hex or tailwind color name
  fontFamily: 'sans' | 'serif' | 'mono' | 'grotesk';
  spacing: 'compact' | 'normal' | 'relaxed';
  showExperienceSection: boolean;
  showEducationSection: boolean;
  showProjectsSection: boolean;
  showCertificationsSection: boolean;
  showLanguagesSection: boolean;
}

export interface CVRecord {
  id: string;
  title: string;
  data: CVData;
  design: DesignConfig;
  createdAt: any;
  updatedAt: any;
  isDefault?: boolean;
}

export type AutosaveStatus = "saved" | "saving" | "local" | "error";

// ATS Analyzer Types
export type ATSIssueSeverity = "critical" | "important" | "suggestion" | "passed";
export type ATSCategory = 
  | "parseability" 
  | "structure" 
  | "contentQuality" 
  | "achievementImpact" 
  | "readability" 
  | "contactInfo";

export interface ATSIssue {
  id: string;
  category: ATSCategory;
  severity: ATSIssueSeverity;
  section: string; // e.g. "Contact Information", "Experience → Senior Engineer → Bullet 2", "Professional Summary"
  targetLocation?: {
    sectionKey: keyof CVData;
    itemId?: string;
    bulletIndex?: number;
  };
  what: string; // What is wrong
  why: string; // Why it matters
  how: string; // How to improve it
  originalText?: string;
  suggestedText?: string;
}

export interface ATSCategoryScores {
  parseability: number; // Weight: 25%
  structure: number; // Weight: 20%
  contentQuality: number; // Weight: 20%
  achievementImpact: number; // Weight: 15%
  readability: number; // Weight: 15%
  contactInfo: number; // Weight: 5%
}

export interface ATSAnalysisResult {
  overallScore: number; // 0 - 100
  rating: "Exceptional" | "Strong ATS Match" | "Moderate Compatibility" | "Needs Optimization";
  categoryScores: ATSCategoryScores;
  criticalIssues: ATSIssue[];
  importantImprovements: ATSIssue[];
  suggestions: ATSIssue[];
  passedChecks: ATSIssue[];
  analyzedAt: string;
}

