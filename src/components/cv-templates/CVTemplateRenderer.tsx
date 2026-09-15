import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin } from 'react-icons/fa';
import './cv-templates.css';

export interface CVData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: string;
  experience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  languages?: Array<{ name: string; proficiency: string }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    projectUrl: string;
    githubUrl: string;
    startDate: string;
    endDate: string;
  }>;
}

export type CVTemplateId = 'modern' | 'professional' | 'creative' | 'minimalist' | 'executive' | 'ats' | 'compact';

export const sampleCVData: CVData = {
  personalInfo: { fullName: 'Alex Morgan', title: 'Product Designer', email: 'alex@example.com', phone: '+234 800 000 0000', location: 'Lagos, Nigeria' },
  summary: 'Product designer focused on clear, accessible digital experiences.',
  experience: [{ jobTitle: 'Product Designer', company: 'Example Studio', startDate: '2022', endDate: '', currentlyWorking: true, description: 'Led product design from discovery through delivery.' }],
  education: [{ degree: 'BSc Design', school: 'University', year: '2021' }],
  skills: ['Product design', 'Research', 'Figma'],
  certifications: [{ name: 'UX Certification', issuer: 'Design Institute' }],
  languages: [{ name: 'English', proficiency: 'Professional' }],
  projects: [{ name: 'Hiring platform', description: 'A focused candidate experience.', technologies: ['Figma'], projectUrl: '', githubUrl: '', startDate: '2023', endDate: '' }],
};

interface CVTemplateRendererProps {
  data: CVData;
  template: CVTemplateId;
}

function AdditionalSections({ data, className }: { data: CVData; className: string }) {
  return <>
    {(data.languages ?? []).length > 0 && <section className={className}><h3>Languages</h3>{data.languages?.map((language) => <p key={`${language.name}-${language.proficiency}`}><strong>{language.name}</strong> - {language.proficiency}</p>)}</section>}
    {(data.projects ?? []).length > 0 && <section className={className}><h3>Projects</h3>{data.projects?.map((project) => <div key={project.name} className="cv-entry"><div className="cv-entry__header"><strong>{project.name}</strong><span>{project.startDate}{project.endDate ? ` - ${project.endDate}` : ''}</span></div>{project.description && <p>{project.description}</p>}{project.technologies.length > 0 && <p><strong>Technologies:</strong> {project.technologies.join(', ')}</p>}{project.projectUrl && <p>{project.projectUrl}</p>}{project.githubUrl && <p>{project.githubUrl}</p>}</div>)}</section>}
  </>;
}

// Modern Template with sidebar
function ModernTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-modern">
      <div className="cv-modern__sidebar">
        <div className="cv-modern__header">
          <h1>{data.personalInfo.fullName}</h1>
          <p className="cv-modern__title">{data.personalInfo.title}</p>
        </div>

        <section className="cv-modern__section">
          <h3>Contact</h3>
          <div className="cv-modern__contact">
            {data.personalInfo.email && (
              <p><FaEnvelope /> {data.personalInfo.email}</p>
            )}
            {data.personalInfo.phone && (
              <p><FaPhone /> {data.personalInfo.phone}</p>
            )}
            {data.personalInfo.location && (
              <p><FaMapMarkerAlt /> {data.personalInfo.location}</p>
            )}
          </div>
        </section>

        {data.skills.length > 0 && (
          <section className="cv-modern__section">
            <h3>Skills</h3>
            <div className="cv-modern__skills">
              {data.skills.map((skill) => (
                <span key={skill} className="cv-skill-tag">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {data.certifications.length > 0 && (
          <section className="cv-modern__section">
            <h3>Qualifications</h3>
            {data.certifications.map((cert, idx) => (
              <div key={idx}>
                <strong>{cert.name}</strong>
                <p>{cert.issuer}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="cv-modern__content">
        {data.summary && (
          <section className="cv-modern__section">
            <h3>Professional Summary</h3>
            <p>{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="cv-modern__section">
            <h3>Experience</h3>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="cv-entry">
                <div className="cv-entry__header">
                  <div>
                    <strong>{exp.jobTitle}</strong>
                    <p>{exp.company}</p>
                  </div>
                  <span className="cv-entry__date">
                    {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="cv-entry__desc">{exp.description}</p>
              </div>
            ))}
          </section>
        )}

        {data.education.length > 0 && (
          <section className="cv-modern__section">
            <h3>Education</h3>
            {data.education.map((edu, idx) => (
              <div key={idx} className="cv-entry">
                <div className="cv-entry__header">
                  <strong>{edu.degree}</strong>
                  <span>{edu.year}</span>
                </div>
                <p>{edu.school}</p>
              </div>
            ))}
          </section>
        )}
      </div>
      <AdditionalSections data={data} className="cv-modern__section" />
    </div>
  );
}

// Professional Template - Traditional layout
function ProfessionalTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-professional">
      <div className="cv-professional__header">
        <h1>{data.personalInfo.fullName}</h1>
        <p className="cv-professional__title">{data.personalInfo.title}</p>
        <div className="cv-professional__contact">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      {data.summary && (
        <section className="cv-professional__section">
          <h3>Professional Summary</h3>
          <p>{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="cv-professional__section">
          <h3>Professional Experience</h3>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="cv-entry">
              <div className="cv-entry__header">
                <strong>{exp.jobTitle}</strong>
                <span>{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
              </div>
              <p className="cv-entry__company">{exp.company}</p>
              <p className="cv-entry__desc">{exp.description}</p>
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="cv-professional__section">
          <h3>Education</h3>
          {data.education.map((edu, idx) => (
            <div key={idx}>
              <strong>{edu.degree}</strong>
              <p>{edu.school} - {edu.year}</p>
            </div>
          ))}
        </section>
      )}

      <div className="cv-professional__footer">
        {data.skills.length > 0 && (
          <div>
            <strong>Skills:</strong>
            <p>{data.skills.join(' • ')}</p>
          </div>
        )}
      </div>
      <AdditionalSections data={data} className="cv-professional__section" />
    </div>
  );
}

// Creative Template - Visually interesting
function CreativeTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-creative">
      <div className="cv-creative__header">
        <div className="cv-creative__profile">
          <h1>{data.personalInfo.fullName}</h1>
          <p className="cv-creative__title">{data.personalInfo.title}</p>
        </div>
        <div className="cv-creative__contact">
          {data.personalInfo.email && (
            <p><FaEnvelope /> {data.personalInfo.email}</p>
          )}
          {data.personalInfo.phone && (
            <p><FaPhone /> {data.personalInfo.phone}</p>
          )}
          {data.personalInfo.location && (
            <p><FaMapMarkerAlt /> {data.personalInfo.location}</p>
          )}
        </div>
      </div>

      <div className="cv-creative__grid">
        <div className="cv-creative__main">
          {data.summary && (
            <section className="cv-creative__section">
              <h3>About</h3>
              <p>{data.summary}</p>
            </section>
          )}
          <AdditionalSections data={data} className="cv-creative__section" />

          {data.experience.length > 0 && (
            <section className="cv-creative__section">
              <h3>Experience</h3>
              {data.experience.map((exp, idx) => (
                <div key={idx} className="cv-creative__entry">
                  <h4>{exp.jobTitle}</h4>
                  <p className="cv-creative__company">{exp.company}</p>
                  <p className="cv-creative__date">
                    {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                  </p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        <aside className="cv-creative__side">
          {data.skills.length > 0 && (
            <section className="cv-creative__section">
              <h3>Skills</h3>
              <div className="cv-creative__skills">
                {data.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section className="cv-creative__section">
              <h3>Education</h3>
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <strong>{edu.degree}</strong>
                  <p>{edu.school}</p>
                  <span>{edu.year}</span>
                </div>
              ))}
            </section>
          )}

          {data.certifications.length > 0 && (
            <section className="cv-creative__section">
              <h3>Qualifications</h3>
              {data.certifications.map((cert, idx) => (
                <div key={idx}>
                  <strong>{cert.name}</strong>
                  <p>{cert.issuer}</p>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// Minimalist Template - Clean and simple
function MinimalistTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-minimalist">
      <div className="cv-minimalist__header">
        <h1>{data.personalInfo.fullName}</h1>
        <p className="cv-minimalist__title">{data.personalInfo.title}</p>
        <div className="cv-minimalist__contact">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>•</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>•</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      {data.summary && (
        <section className="cv-minimalist__section">
          <p>{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="cv-minimalist__section">
          <h3>Experience</h3>
          {data.experience.map((exp, idx) => (
            <div key={idx}>
              <div className="cv-minimalist__entry-header">
                <strong>{exp.jobTitle}</strong>
                <span>{exp.startDate} – {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
              </div>
              <p className="cv-minimalist__company">{exp.company}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="cv-minimalist__section">
          <h3>Education</h3>
          {data.education.map((edu, idx) => (
            <div key={idx} className="cv-minimalist__entry-header">
              <strong>{edu.degree}</strong>
              <span>{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="cv-minimalist__section">
          <h3>Skills</h3>
          <p>{data.skills.join(' • ')}</p>
        </section>
      )}
      <AdditionalSections data={data} className="cv-minimalist__section" />
    </div>
  );
}

function ExecutiveTemplate({ data }: { data: CVData }) {
  return <div className="cv-executive">
    <header className="cv-executive__header">
      <div><h1>{data.personalInfo.fullName}</h1><p>{data.personalInfo.title}</p></div>
      <div className="cv-executive__contact">
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
      </div>
    </header>
    <div className="cv-executive__grid">
      <main>
        {data.summary && <section><h2>Profile</h2><p>{data.summary}</p></section>}
        {data.experience.length > 0 && <section><h2>Experience</h2>{data.experience.map((item) => <div className="cv-executive__entry" key={`${item.jobTitle}-${item.company}`}><div><strong>{item.jobTitle}</strong><span>{item.company}</span></div><time>{item.startDate} - {item.currentlyWorking ? 'Present' : item.endDate}</time><p>{item.description}</p></div>)}</section>}
        {data.education.length > 0 && <section><h2>Education</h2>{data.education.map((item) => <div className="cv-executive__entry" key={`${item.degree}-${item.school}`}><div><strong>{item.degree}</strong><span>{item.school}</span></div><time>{item.year}</time></div>)}</section>}
      </main>
      <aside>
        {data.skills.length > 0 && <section><h2>Expertise</h2><ul>{data.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></section>}
        {data.certifications.length > 0 && <section><h2>Credentials</h2>{data.certifications.map((item) => <p key={`${item.name}-${item.issuer}`}><strong>{item.name}</strong><span>{item.issuer}</span></p>)}</section>}
        <AdditionalSections data={data} className="cv-executive__section" />
      </aside>
    </div>
  </div>;
}

function AtsTemplate({ data }: { data: CVData }) {
  return <div className="cv-ats">
    <header><h1>{data.personalInfo.fullName}</h1><p>{data.personalInfo.title}</p><div>{[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join(' | ')}</div></header>
    {data.summary && <section><h2>Professional Summary</h2><p>{data.summary}</p></section>}
    {data.experience.length > 0 && <section><h2>Experience</h2>{data.experience.map((item) => <article key={`${item.jobTitle}-${item.company}`}><div><strong>{item.jobTitle}</strong><span>{item.company}</span><time>{item.startDate} - {item.currentlyWorking ? 'Present' : item.endDate}</time></div><p>{item.description}</p></article>)}</section>}
    {data.education.length > 0 && <section><h2>Education</h2>{data.education.map((item) => <article key={`${item.degree}-${item.school}`}><strong>{item.degree}</strong><span>{item.school}</span><time>{item.year}</time></article>)}</section>}
    {data.skills.length > 0 && <section><h2>Skills</h2><p>{data.skills.join(' | ')}</p></section>}
    {data.certifications.length > 0 && <section><h2>Certifications</h2>{data.certifications.map((item) => <p key={`${item.name}-${item.issuer}`}><strong>{item.name}</strong> - {item.issuer}</p>)}</section>}
    <AdditionalSections data={data} className="cv-ats__section" />
  </div>;
}

function CompactTemplate({ data }: { data: CVData }) {
  return <div className="cv-compact">
    <header><div><h1>{data.personalInfo.fullName}</h1><p>{data.personalInfo.title}</p></div><div>{[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></header>
    <div className="cv-compact__body">
      <main>
        {data.summary && <section><h2>Summary</h2><p>{data.summary}</p></section>}
        {data.experience.length > 0 && <section><h2>Experience</h2>{data.experience.map((item) => <article key={`${item.jobTitle}-${item.company}`}><div><strong>{item.jobTitle}</strong><span>{item.company}</span></div><time>{item.startDate} - {item.currentlyWorking ? 'Present' : item.endDate}</time><p>{item.description}</p></article>)}</section>}
        {data.education.length > 0 && <section><h2>Education</h2>{data.education.map((item) => <article key={`${item.degree}-${item.school}`}><strong>{item.degree}</strong><span>{item.school}</span><time>{item.year}</time></article>)}</section>}
      </main>
      <aside>
        {data.skills.length > 0 && <section><h2>Skills</h2><ul>{data.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></section>}
        {data.certifications.length > 0 && <section><h2>Certifications</h2>{data.certifications.map((item) => <p key={`${item.name}-${item.issuer}`}><strong>{item.name}</strong><br />{item.issuer}</p>)}</section>}
        <AdditionalSections data={data} className="cv-compact__section" />
      </aside>
    </div>
  </div>;
}

function CVTemplateRenderer({ data, template }: CVTemplateRendererProps) {
  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <ModernTemplate data={data} />;
      case 'professional':
        return <ProfessionalTemplate data={data} />;
      case 'creative':
        return <CreativeTemplate data={data} />;
      case 'minimalist':
        return <MinimalistTemplate data={data} />;
      case 'executive':
        return <ExecutiveTemplate data={data} />;
      case 'ats':
        return <AtsTemplate data={data} />;
      case 'compact':
        return <CompactTemplate data={data} />;
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return <div className="cv-template-renderer">{renderTemplate()}</div>;
}

export default CVTemplateRenderer;
