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

// ==========================================
// Job Match Types (Strictly separate from ATS)
// ==========================================

export type KeywordPriority = "required" | "preferred" | "general";

export interface SkillMatchItem {
  name: string;
  status: "matched" | "partial" | "missing";
  matchType?: "exact" | "semantic" | "none";
  category?: string; // e.g., "Frontend", "Cloud", "Methodology"
  foundLocation?: string; // e.g., "Skills list", "Experience: Senior Engineer"
}

export interface KeywordMatchItem {
  keyword: string;
  priority: KeywordPriority;
  status: "present" | "missing";
  frequencyInJob: number;
  frequencyInCV: number;
  contextSnippet?: string;
}

export interface JobGapItem {
  id: string;
  jobRequirement: string; // What the job requires
  cvStatus: string; // What the CV currently shows
  recommendation: string; // How the user can improve (with anti-hallucination guardrail)
  severity: "high" | "medium" | "low";
}

export interface JobStrengthItem {
  id: string;
  title: string;
  description: string;
  evidence: string;
}

export interface JobContentImprovement {
  id: string;
  section: string;
  itemId?: string;
  bulletIndex?: number;
  originalText: string;
  suggestedText: string;
  explanation: string;
}

export interface JobMatchCategoryScores {
  skillsMatch: number; // Weight: 30%
  experienceAlignment: number; // Weight: 25%
  keywordCoverage: number; // Weight: 20%
  roleRelevance: number; // Weight: 15%
  educationAlignment: number; // Weight: 10%
}

export interface JobMatchResult {
  overallScore: number; // 0 - 100 (Computed deterministically from weighted categories)
  matchRating: "High Match" | "Strong Match" | "Moderate Match" | "Low Match";
  jobTitle?: string;
  companyName?: string;
  categoryScores: JobMatchCategoryScores;
  matchingSkills: SkillMatchItem[];
  missingSkills: SkillMatchItem[];
  keywords: KeywordMatchItem[];
  strengths: JobStrengthItem[];
  gaps: JobGapItem[];
  contentImprovements: JobContentImprovement[];
  analyzedAt: string;
  jobDescriptionHash?: string;
}

