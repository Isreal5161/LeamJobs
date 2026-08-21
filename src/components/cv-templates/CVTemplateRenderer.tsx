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
}

interface CVTemplateRendererProps {
  data: CVData;
  template: 'modern' | 'professional' | 'creative' | 'minimalist';
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
    </div>
  );
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
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return <div className="cv-template-renderer">{renderTemplate()}</div>;
}

export default CVTemplateRenderer;
