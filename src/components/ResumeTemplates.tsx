import React from "react";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Award, Calendar, ToggleLeft } from "lucide-react";
import { CVData, DesignConfig } from "../types";

interface ResumeTemplatesProps {
  data: CVData;
  design: DesignConfig;
  targetRef?: React.RefObject<HTMLDivElement | null>;
}

export const ResumeTemplates: React.FC<ResumeTemplatesProps> = ({ data, design, targetRef }) => {
  const { personal, summary, experience, education, skills, projects, certifications, languages } = data;

  // Spacing configurations
  const getSpaceClass = (type: 'margin' | 'padding' | 'subspace') => {
    if (design.spacing === 'compact') {
      if (type === 'margin') return 'mb-2 md:mb-3';
      if (type === 'padding') return 'py-1';
      return 'space-y-2';
    } else if (design.spacing === 'relaxed') {
      if (type === 'margin') return 'mb-6 md:mb-8';
      if (type === 'padding') return 'py-3';
      return 'space-y-6';
    } else { // normal
      if (type === 'margin') return 'mb-4 md:mb-5';
      if (type === 'padding') return 'py-2';
      return 'space-y-4';
    }
  };

  const getSectionSpaceClass = () => {
    if (design.spacing === 'compact') {
      return 'space-y-5';
    } else if (design.spacing === 'relaxed') {
      return 'space-y-9';
    } else { // normal
      return 'space-y-7';
    }
  };

  // Font families mapping
  const getFontFamilyClass = () => {
    switch (design.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono text-sm leading-relaxed';
      case 'grotesk':
        return 'font-sans tracking-wide font-light leading-relaxed';
      default:
        return 'font-sans leading-relaxed';
    }
  };

  const getHeadingFontFamilyClass = () => {
    switch (design.fontFamily) {
      case 'serif':
        return 'font-serif font-bold tracking-tight';
      case 'mono':
        return 'font-mono font-bold uppercase';
      case 'grotesk':
        return 'font-sans font-semibold uppercase tracking-wider';
      default:
        return 'font-sans font-extrabold tracking-tight';
    }
  };

  // Safe split helper for experience/projects description bullet points
  const renderBulletPoints = (textString: string) => {
    if (!textString) return null;
    const bullets = textString
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    return (
      <div className="mt-2 pl-1 leading-relaxed select-none overflow-hidden" style={{ width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            {bullets.map((bullet, idx) => {
              const cleanBullet = bullet.replace(/^[-*•]\s*/, '');
              return (
                <tr key={idx} style={{ verticalAlign: 'top' }}>
                  <td style={{ width: '14px', padding: '3px 0', verticalAlign: 'top', textAlign: 'left' }}>
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', backgroundColor: '#94a3b8', borderRadius: '50%', marginTop: '5px' }} />
                  </td>
                  <td style={{ padding: '2px 0 2px 4px', verticalAlign: 'top', textAlign: 'left' }}>
                    <span className="text-slate-600 font-sans text-xs select-text" style={{ display: 'block', wordBreak: 'break-word', lineHeight: '1.5' }}>
                      {cleanBullet}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Personal Links Filter
  const links = [
    { value: personal.email, icon: <Mail size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> },
    { value: personal.phone, icon: <Phone size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> },
    { value: personal.location, icon: <MapPin size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> },
    { value: personal.linkedin, icon: <Linkedin size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> },
    { value: personal.github, icon: <Github size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> },
    { value: personal.website, icon: <Globe size={12} style={{ display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 }} /> }
  ].filter(link => link.value && link.value.trim() !== '');

  // Render correct design template
  const isThemeDark = (hex: string) => {
    // Simple hex brightness detector
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 120;
  };

  const textContrastColorStyle = {
    color: isThemeDark(design.themeColor) ? '#ffffff' : '#0f172a'
  };

  // --- TEMPLATE 1: Executive ---
  const renderExecutive = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 text-xs">
      {/* Header Banner */}
      <div 
        className="p-8 pb-6 text-center border-b-2 select-none" 
        style={{ borderColor: design.themeColor }}
      >
        <h1 className="text-3xl uppercase font-extrabold text-slate-900 tracking-tight">
          {personal.fullName || "Your Full Name"}
        </h1>
        {personal.jobTitle && (
          <p className="text-xs font-semibold mt-1.5 uppercase tracking-widest text-slate-500">
            {personal.jobTitle}
          </p>
        )}
        
        {/* Links Grid using classic safe Table */}
        <table className="w-full max-w-xl mx-auto mt-4 text-slate-600 text-[11px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            {(() => {
              const rows = [];
              for (let i = 0; i < links.length; i += 2) {
                rows.push(links.slice(i, i + 2));
              }
              return rows.map((rowLinks, rIdx) => (
                <tr key={rIdx}>
                  {rowLinks.map((link, cIdx) => (
                    <td key={cIdx} style={{ width: '50%', padding: '4px 8px', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <span className="inline-flex items-center gap-2" style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                        <span style={{ color: design.themeColor, display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                          {link.icon}
                        </span>
                        <span className="text-slate-600" style={{ display: 'inline-block', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {link.value}
                        </span>
                      </span>
                    </td>
                  ))}
                  {rowLinks.length === 1 && <td style={{ width: '50%' }}></td>}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      <div className={`p-8 ${getSectionSpaceClass()} flex-grow animate-fade-in`}>
        {/* Summary */}
        {summary && (
          <div className="block" style={{ marginBottom: '24px' }}>
            <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-3 block" style={{ borderBottom: '1.5px solid #cbd5e1', lineHeight: '1.2' }}>
              Professional Summary
            </h2>
            <p className="text-slate-650 leading-relaxed text-xs mt-1" style={{ lineHeight: '1.6' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {design.showExperienceSection && experience.length > 0 && (
          <div className="block" style={{ marginBottom: '24px' }}>
            <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-4 block" style={{ borderBottom: '1.5px solid #cbd5e1', lineHeight: '1.2' }}>
              Work Experience
            </h2>
            <div className={getSpaceClass('subspace')}>
              {experience.map((exp) => (
                <div key={exp.id} className="block" style={{ marginBottom: design.spacing === 'compact' ? '12px' : design.spacing === 'relaxed' ? '24px' : '18px' }}>
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                          <span className="font-bold text-slate-900 text-[13.5px]" style={{ lineHeight: '1.3' }}>
                            {exp.position}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '150px' }}>
                          <span className="text-[11px] font-semibold text-slate-500" style={{ whiteSpace: 'nowrap' }}>
                            {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '2px' }}>
                          <span className="text-slate-600 text-[11px] font-semibold italic">
                            {exp.company}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', width: '150px', paddingTop: '2px' }}>
                          <span className="text-slate-500 text-[11px] italic" style={{ whiteSpace: 'nowrap' }}>
                            {exp.location}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: '2px' }}>
                    {renderBulletPoints(exp.description)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {design.showEducationSection && education.length > 0 && (
          <div className="block" style={{ marginBottom: '24px' }}>
            <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-4 block" style={{ borderBottom: '1.5px solid #cbd5e1', lineHeight: '1.2' }}>
              Education
            </h2>
            <div className={getSpaceClass('subspace')}>
              {education.map((edu) => (
                <div key={edu.id} className="block" style={{ marginBottom: design.spacing === 'compact' ? '12px' : design.spacing === 'relaxed' ? '24px' : '18px' }}>
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                          <span className="font-bold text-slate-900 text-[13.5px]" style={{ lineHeight: '1.3' }}>
                            {edu.degree} in {edu.field}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '150px' }}>
                          <span className="text-[11px] font-semibold text-slate-550 shrink-0" style={{ whiteSpace: 'nowrap' }}>
                            {edu.startDate} – {edu.current ? "Present" : edu.endDate}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '2px' }}>
                          <span className="text-slate-600 text-[11px] font-semibold italic">
                            {edu.school}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', width: '150px', paddingTop: '2px' }}>
                          <span className="text-slate-500 text-[11px] italic" style={{ whiteSpace: 'nowrap' }}>
                            {edu.location}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {edu.notes && (
                    <p className="text-slate-600 text-[11px] leading-relaxed pl-1 mt-1.5" style={{ lineHeight: '1.5' }}>
                      {edu.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {design.showProjectsSection && projects.length > 0 && (
          <div className="block" style={{ marginBottom: '24px' }}>
            <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-4 block" style={{ borderBottom: '1.5px solid #cbd5e1', lineHeight: '1.2' }}>
              Projects
            </h2>
            <div className={getSpaceClass('subspace')}>
              {projects.map((proj) => (
                <div key={proj.id} className="block" style={{ marginBottom: design.spacing === 'compact' ? '12px' : design.spacing === 'relaxed' ? '24px' : '18px' }}>
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                          <span className="font-bold text-slate-900 text-[13.5px] flex items-center gap-1.5" style={{ lineHeight: '1.3' }}>
                            {proj.name}
                            {proj.link && (
                              <span className="text-[10px] text-slate-400 font-normal italic">
                                ({proj.link})
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '200px' }}>
                          {proj.technologies && (
                            <span className="text-[10.5px] text-slate-500 font-mono italic" style={{ whiteSpace: 'nowrap' }}>
                              {proj.technologies}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-slate-705 leading-relaxed text-xs pl-1" style={{ lineHeight: '1.6', marginTop: '4px' }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider line element */}
        <hr className="block border-t border-slate-200 my-5" style={{ height: '0px', borderTop: '1.5px solid #e2e8f0' }} />

        {/* Extra Info Grid: Skills, Certifications, Languages in columns */}
        <table className="w-full table-fixed mt-6" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
          <tbody>
            <tr>
              {/* Skills Column */}
              <td style={{ width: '33.333%', padding: '0 12px 0 0', verticalAlign: 'top', textAlign: 'left' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-2.5 block font-sans" style={{ borderBottom: '1px solid #cbd5e1' }}>
                  Skills
                </h3>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-slate-700 font-medium">
                  {skills.map((skill, index) => (
                    <span key={index} style={{ display: 'inline-block', lineHeight: '1.5' }}>
                      {skill}
                      {index < skills.length - 1 && <span className="text-slate-300 font-normal ml-1.5">•</span>}
                    </span>
                  ))}
                </div>
              </td>

              {/* Certifications Column */}
              <td style={{ width: '33.333%', padding: '0 12px', verticalAlign: 'top', textAlign: 'left' }}>
                {design.showCertificationsSection && certifications.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-2.5 block font-sans" style={{ borderBottom: '1px solid #cbd5e1' }}>
                      Certifications
                    </h3>
                    <div className="space-y-2">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="text-[11px]" style={{ marginBottom: '6px' }}>
                          <div className="font-semibold text-slate-900 leading-tight">{cert.name}</div>
                          <div className="text-slate-500 text-[10px]" style={{ marginTop: '2px' }}>{cert.issuer} ({cert.date})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </td>

              {/* Languages Column */}
              <td style={{ width: '33.333%', padding: '0 0 0 12px', verticalAlign: 'top', textAlign: 'left' }}>
                {design.showLanguagesSection && languages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-2.5 block font-sans" style={{ borderBottom: '1px solid #cbd5e1' }}>
                      Languages
                    </h3>
                    <div className="space-y-1.5">
                      {languages.map((lang) => (
                        <table key={lang.id} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                                <span className="font-semibold text-slate-800 text-[11px]">{lang.name}</span>
                              </td>
                              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '80px' }}>
                                <span className="text-slate-500 text-[10px]">{lang.proficiency}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ))}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- TEMPLATE 2: Minimalist ---
  const renderMinimalist = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 text-xs p-10">
      {/* Top Details Grid */}
      <table className="w-full text-left pb-4 mb-6" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', borderBottom: '2.5px solid #cbd5e1' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'bottom', textAlign: 'left' }}>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {personal.fullName || "Your Full Name"}
              </h1>
              {personal.jobTitle && (
                <p className="text-sm font-semibold tracking-wide text-slate-550 mt-1 uppercase" style={{ trackingWidth: '0.05em' }}>
                  {personal.jobTitle}
                </p>
              )}
            </td>
            <td style={{ width: '220px', verticalAlign: 'bottom', textAlign: 'right' }}>
              <div className="text-[11px] text-slate-500" style={{ lineHeight: '1.5' }}>
                {personal.email && <div>{personal.email}</div>}
                {personal.phone && <div>{personal.phone}</div>}
                {personal.location && <div>{personal.location}</div>}
                {personal.linkedin && <div>{personal.linkedin}</div>}
                {personal.github && <div>{personal.github}</div>}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="space-y-5 flex-grow">
        <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
          <tbody>
            {/* Summary */}
            {summary && (
              <tr>
                <td style={{ width: '140px', padding: '16px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Profile
                  </span>
                </td>
                <td style={{ padding: '16px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <p className="text-slate-700 leading-relaxed text-xs" style={{ lineHeight: '1.6' }}>
                    {summary}
                  </p>
                </td>
              </tr>
            )}

            {/* Experience */}
            {design.showExperienceSection && experience.length > 0 && (
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ width: '140px', padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Experience
                  </span>
                </td>
                <td style={{ padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  {experience.map((exp, idx) => (
                    <div key={exp.id} className="block" style={{ marginBottom: idx < experience.length - 1 ? '18px' : '0' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                              <span className="font-bold text-slate-900 text-xs">
                                {exp.position} — <span className="font-semibold text-slate-600">{exp.company}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '150px' }}>
                              <span className="text-slate-400 font-normal text-[11px]" style={{ whiteSpace: 'nowrap' }}>
                                {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="text-[10px] text-slate-400 italic mb-2">
                        {exp.location}
                      </div>
                      {renderBulletPoints(exp.description)}
                    </div>
                  ))}
                </td>
              </tr>
            )}

            {/* Education */}
            {design.showEducationSection && education.length > 0 && (
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ width: '140px', padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Education
                  </span>
                </td>
                <td style={{ padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  {education.map((edu, idx) => (
                    <div key={edu.id} className="block" style={{ marginBottom: idx < education.length - 1 ? '16px' : '0' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                              <span className="font-bold text-slate-900 text-xs">
                                {edu.degree} in {edu.field}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '150px' }}>
                              <span className="text-slate-400 font-normal text-[11px]" style={{ whiteSpace: 'nowrap' }}>
                                {edu.startDate} – {edu.current ? "Present" : edu.endDate}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="text-slate-600 italic text-[11px]">{edu.school}, {edu.location}</div>
                      {edu.notes && <p className="text-slate-550 text-[11px] mt-1.5" style={{ lineHeight: '1.5' }}>{edu.notes}</p>}
                    </div>
                  ))}
                </td>
              </tr>
            )}

            {/* Projects */}
            {design.showProjectsSection && projects.length > 0 && (
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ width: '140px', padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Projects
                  </span>
                </td>
                <td style={{ padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  {projects.map((proj, idx) => (
                    <div key={proj.id} className="block" style={{ marginBottom: idx < projects.length - 1 ? '16px' : '0' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', marginBottom: '4px' }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'left', verticalAlign: 'bottom' }}>
                              <span className="font-bold text-slate-900 text-xs">
                                {proj.name}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'bottom', width: '150px' }}>
                              {proj.technologies && (
                                <span className="text-[10px] text-slate-500 font-mono italic" style={{ whiteSpace: 'nowrap' }}>
                                  {proj.technologies}
                                </span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-slate-700 mt-1 text-xs" style={{ lineHeight: '1.6' }}>{proj.description}</p>
                    </div>
                  ))}
                </td>
              </tr>
            )}

            {/* Skills */}
            <tr style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ width: '140px', padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Core Skills
                </span>
              </td>
              <td style={{ padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs">
                  {skills.map((skill, index) => (
                    <span key={index} className="px-1 text-slate-800 border-r last:border-r-0 border-slate-300 pr-2.5" style={{ display: 'inline-block' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </td>
            </tr>

            {/* Credentials & Languages */}
            {(certifications.length > 0 || languages.length > 0) && (
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ width: '140px', padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Credentials
                  </span>
                </td>
                <td style={{ padding: '18px 0', verticalAlign: 'top', textAlign: 'left' }}>
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
                    <tbody>
                      <tr>
                        {/* Certifications column */}
                        <td style={{ width: '50%', paddingRight: '12px', verticalAlign: 'top', textAlign: 'left' }}>
                          {design.showCertificationsSection && certifications.length > 0 && (
                            <div>
                              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-450 mb-2">
                                Certificates / Awards
                              </h3>
                              {certifications.map((cert) => (
                                <p key={cert.id} className="text-[11px] text-slate-705" style={{ marginBottom: '6px' }}>
                                  <span className="font-semibold text-slate-900">{cert.name}</span> — {cert.issuer}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Languages column */}
                        <td style={{ width: '50%', paddingLeft: '12px', verticalAlign: 'top', textAlign: 'left' }}>
                          {design.showLanguagesSection && languages.length > 0 && (
                            <div>
                              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-450 mb-2">
                                Languages
                              </h3>
                              {languages.map((lang) => (
                                <p key={lang.id} className="text-[11px] text-slate-705" style={{ marginBottom: '6px' }}>
                                  <span className="font-semibold text-slate-900">{lang.name}</span> ({lang.proficiency})
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- TEMPLATE 3: Creative ---
  const renderCreative = () => (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] h-full bg-slate-50 text-slate-800 text-xs">
      {/* Sidebar Section */}
      <div 
        className="p-8 text-white flex flex-col gap-6" 
        style={{ backgroundColor: design.themeColor }}
      >
        {/* Name and Title */}
        <div className="border-b border-white/20 pb-6">
          <h1 className="text-2xl font-black leading-tight tracking-tight uppercase">
            {personal.fullName || "Your Name"}
          </h1>
          {personal.jobTitle && (
            <p className="text-white/80 font-mono text-[11px] uppercase tracking-widest mt-1">
              {personal.jobTitle}
            </p>
          )}
        </div>

        {/* Contact Links */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-3">
            Contact Details
          </h2>
          <div className="space-y-2 text-[11px]">
            {links.map((link, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 text-white/80">{link.icon}</span>
                <span className="break-all text-white/90">{link.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Tags */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2.5">
            Core Expertise
          </h2>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-[11px] text-white/90">
            {skills.map((skill, index) => (
              <React.Fragment key={index}>
                <span>{skill}</span>
                {index < skills.length - 1 && <span className="text-white/40 font-light">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Languages section inside Sidebar */}
        {design.showLanguagesSection && languages.length > 0 && (
          <div className="mt-auto pt-6 border-t border-white/10">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">
              Languages
            </h2>
            <div className="space-y-1 text-white/90 text-[11px]">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between">
                  <span>{lang.name}</span>
                  <span className="text-white/60 text-[10px]">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Panel Section */}
      <div className="p-8 bg-white flex flex-col space-y-6 flex-grow shadow-inner">
        {/* Summary Block */}
        {summary && (
          <div className="p-4 bg-slate-50 border-l-4 rounded-r" style={{ borderLeftColor: design.themeColor }}>
            <p className="italic text-slate-700 leading-relaxed text-xs">
              {summary}
            </p>
          </div>
        )}

        {/* Experience Details */}
        {design.showExperienceSection && experience.length > 0 && (
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              Professional Career
            </h2>
            <div className={getSpaceClass('subspace')}>
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l border-slate-100">
                  {/* Subtle dot */}
                  <span className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-300"></span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{exp.position}</h3>
                    <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 rounded">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-slate-500 font-semibold mb-1 text-[11px]">
                    {exp.company} | <span className="font-normal italic">{exp.location}</span>
                  </div>
                  {renderBulletPoints(exp.description)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Details */}
        {design.showEducationSection && education.length > 0 && (
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              Education & Studies
            </h2>
            <div className="space-y-3 pl-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-[13px]">{edu.degree} in {edu.field}</h3>
                    <span className="text-[10px] font-semibold text-slate-500">{edu.startDate} – {edu.current ? "Present" : edu.endDate}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] font-medium leading-tight mb-1">
                    {edu.school}, {edu.location}
                  </div>
                  {edu.notes && <p className="text-slate-500 text-[11px] leading-relaxed italic">{edu.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {design.showProjectsSection && projects.length > 0 && (
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              Featured Projects
            </h2>
            <div className="space-y-3 pl-4">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900">{proj.name}</h3>
                    {proj.technologies && (
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                        {proj.technologies}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed text-xs">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {design.showCertificationsSection && certifications.length > 0 && (
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              Professional Credentials
            </h2>
            <div className="grid grid-cols-2 gap-3 pl-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="p-2 border rounded border-slate-100 bg-slate-50">
                  <div className="font-bold text-slate-900 text-[11px]">{cert.name}</div>
                  <div className="text-slate-500 text-[10px]">
                    {cert.issuer} ({cert.date})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- TEMPLATE 4: Modern Tech ---
  const renderModern = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 text-xs font-mono p-8 relative overflow-hidden">
      {/* Background neon effect line */}
      <div 
        className="absolute left-0 top-0 w-1.5 h-full" 
        style={{ backgroundColor: design.themeColor }}
      ></div>

      {/* Top Header Block */}
      <div className="border-b border-slate-800 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span style={{ color: design.themeColor }}>[</span>
              {personal.fullName || "NAME_REQUIRED"}
              <span style={{ color: design.themeColor }}>]</span>
            </h1>
            {personal.jobTitle && (
              <p className="text-xs font-semibold mt-1 uppercase tracking-widest text-slate-400">
                {personal.jobTitle}
              </p>
            )}
          </div>
          <div className="text-right text-[10px] text-slate-500 leading-relaxed font-mono">
            {links.map((link, idx) => (
              <div key={idx} className="flex justify-end items-center gap-1.5 mb-0.5">
                <span>{link.value}</span>
                <span style={{ color: design.themeColor }}>{link.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 flex-grow leading-relaxed">
        {/* Profile / Summary */}
        {summary && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              01 // Professional Profile
            </div>
            <p className="text-slate-400 font-sans leading-relaxed text-xs">
              {summary}
            </p>
          </div>
        )}

        {/* Experience Timeline */}
        {design.showExperienceSection && experience.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              02 // Work Experience
            </div>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l border-slate-800">
                  <div 
                    className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border border-slate-900" 
                    style={{ backgroundColor: design.themeColor }}
                  ></div>
                  <div className="flex justify-between font-bold text-white text-[11px]">
                    <span className="font-sans">{exp.position}</span>
                    <span className="text-slate-500 text-[10px] font-mono">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-slate-500 font-semibold mb-1 text-[10px]">
                    {exp.company} &lt;{exp.location}&gt;
                  </div>
                  <div className="font-sans mt-1 p-2 bg-slate-900/40 rounded border border-slate-900 text-slate-400">
                    {renderBulletPoints(exp.description)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Timeline */}
        {design.showEducationSection && education.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              03 // Academic History
            </div>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="pl-4 border-l border-slate-800 relative">
                  <div className="absolute left-[-3px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  <div className="flex justify-between text-white font-bold text-[11px]">
                    <span className="font-sans">{edu.degree} in {edu.field}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] font-sans">
                    {edu.school}, {edu.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {design.showProjectsSection && projects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: design.themeColor }}></span>
              04 // Code Projects
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
              {projects.map((proj) => (
                <div key={proj.id} className="p-3 bg-slate-900/30 rounded border border-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-white text-[11px] font-mono">{proj.name}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] mb-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                  {proj.technologies && (
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 self-start">
                      {proj.technologies}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Grid (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-2">
              :: Tech Stack
            </div>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 font-mono text-[10px] text-slate-300">
              {skills.map((skill, index) => (
                <React.Fragment key={index}>
                  <span>&lt;{skill}/&gt;</span>
                  {index < skills.length - 1 && <span className="text-slate-700">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="space-y-3 font-sans">
            {design.showCertificationsSection && certifications.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">
                  :: Credentials
                </div>
                {certifications.map((cert) => (
                  <div key={cert.id} className="text-[10px] text-slate-400 leading-normal">
                    &gt; <span className="text-white font-semibold font-mono">{cert.name}</span>
                  </div>
                ))}
              </div>
            )}
            {design.showLanguagesSection && languages.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">
                  :: Languages
                </div>
                <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-400 font-mono">
                  {languages.map((lang) => (
                    <span key={lang.id}>
                      {lang.name}: <span className="text-white font-semibold">{lang.proficiency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const getTemplateRenderer = () => {
    switch (design.templateId) {
      case 'minimalist':
        return renderMinimalist();
      case 'creative':
        return renderCreative();
      case 'modern':
        return renderModern();
      default:
        return renderExecutive();
    }
  };

  return (
    <div 
      ref={targetRef}
      id="cv-pdf-render-target" 
      className={`w-full max-w-full origin-top select-all shadow-xl rounded-md overflow-hidden ${getFontFamilyClass()}`}
      style={{ minHeight: '1050px', aspectRatio: '1 / 1.414', pageBreakInside: 'avoid' }}
    >
      {getTemplateRenderer()}
    </div>
  );
};
