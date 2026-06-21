import { CVData, DesignConfig } from "./types";

export const initialCVData: CVData = {
  personal: {
    fullName: "Name",
    jobTitle: "Write Profession or Job Designation",
    email: "your.email@example.com",
    phone: "your-phone-number",
    location: "City, State/Country",
    linkedin: "linkedin.com/in/yourusername",
    github: "github.com/yourusername",
    website: "yourwebsite.com"
  },
  summary: "Write Your Specific Summary: Highlighting your key experiences, career objectives, skills, or any section content here.",
  experience: [
    {
      id: "exp-1",
      company: "Write Company / Organization Name",
      position: "Write Your Specific Position / Role",
      location: "City, State/Country",
      startDate: "2024-01",
      endDate: "",
      current: true,
      description: "- Write Your Specific Experience, duties, accomplishments, or any section content here.\n- Focus on quantifiable achievements or key skills utilized.\n- Add more bullet points as needed to customize your history."
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "Write School / University Name",
      degree: "Write Degree / Certification",
      field: "Write Major / Field of Study",
      location: "City, State/Country",
      startDate: "2020-09",
      endDate: "2024-05",
      current: false,
      notes: "Write any academic honors, GPA, relevant modules, research projects, or any section content here."
    }
  ],
  skills: [
    "Write Skill 1", 
    "Write Skill 2", 
    "Write Skill 3", 
    "Write Skill 4"
  ],
  projects: [
    {
      id: "proj-1",
      name: "Write Your Project Title",
      technologies: "Write Technologies / Tools Used",
      description: "Write details about your project, your contributions, or any section content here.",
      link: "github.com/yourusername/project-link"
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Write Certification Name",
      issuer: "Write Issuing Organization / Authority",
      date: "2024-01"
    }
  ],
  languages: [
    {
      id: "lang-1",
      name: "Write Language Name",
      proficiency: "Proficiency Level"
    }
  ]
};

export const initialDesignConfig: DesignConfig = {
  templateId: "executive",
  themeColor: "#2563eb", // Primary blue tint
  fontFamily: "sans",
  spacing: "normal",
  showExperienceSection: true,
  showEducationSection: true,
  showProjectsSection: true,
  showCertificationsSection: true,
  showLanguagesSection: true
};
