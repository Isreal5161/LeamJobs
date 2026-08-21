import { useState } from 'react';
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaDownload,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaGraduationCap,
  FaGripVertical,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPlus,
  FaRegSave,
  FaMagic,
  FaUser,
} from 'react-icons/fa';
import CVTemplateSelector from '../../components/cv-templates/CVTemplateSelector';
import CVTemplateRenderer, { CVData } from '../../components/cv-templates/CVTemplateRenderer';
import { downloadCVAsPDF } from '../../utils/cvDownloadUtils';

const steps = ['Personal Info', 'Experience', 'Education', 'Skills', 'Certifications'];
const skills = ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Figma', 'User Testing'];
const qualifications = ['B.Sc. Interaction Design', 'Google UX Certificate', 'Advanced Figma Systems'];

// Sample CV data - replace with actual form data
const sampleCVData: CVData = {
  personalInfo: {
    fullName: 'Sarah Johnson',
    title: 'Senior UI/UX Designer',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/sarahjohnson',
  },
  summary: 'Senior UI/UX Designer with 5+ years of experience building accessible product experiences. Specialized in design systems, user research, and cross-functional collaboration.',
  experience: [
    {
      jobTitle: 'Senior UI/UX Designer',
      company: 'Tech Company Inc.',
      startDate: 'Jan 2022',
      endDate: 'Present',
      currentlyWorking: true,
      description: 'Led design system implementation across 50+ products. Improved user onboarding by 40% through comprehensive UX research and iterative design.',
    },
    {
      jobTitle: 'UX Designer',
      company: 'Design Studio Co.',
      startDate: 'Jun 2020',
      endDate: 'Dec 2021',
      currentlyWorking: false,
      description: 'Designed mobile and web experiences for Fortune 500 clients. Conducted user research studies and usability testing.',
    },
  ],
  education: [
    {
      degree: 'B.Sc. in Interaction Design',
      school: 'University of Design',
      year: '2018',
    },
    {
      degree: 'Google UX Certificate',
      school: 'Google via Coursera',
      year: '2019',
    },
  ],
  skills: skills,
  certifications: [
    {
      name: 'Advanced Figma Systems',
      issuer: 'Figma Academy',
    },
    {
      name: 'Interaction Design Specialist',
      issuer: 'Nielsen Norman Group',
    },
  ],
};

function ProfilePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'professional' | 'creative' | 'minimalist'>('modern');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      await downloadCVAsPDF('cv-preview-container', `${sampleCVData.personalInfo.fullName}-CV.pdf`);
    } catch (error) {
      console.error('Failed to download CV:', error);
    }
  };
  return (
    <div className="seeker-profile-page">
      <section className="seeker-profile-hero">
        <div className="seeker-profile-hero__top">
          <button type="button" className="seeker-profile-icon-button" aria-label="Go back">
            <FaArrowLeft />
          </button>
          <div>
            <h1>My CV</h1>
            <p>Create a polished resume for applications</p>
          </div>
          <button type="button" className="seeker-profile-icon-button" aria-label="CV settings">
            <FaMagic />
          </button>
        </div>
      </section>

      <main className="seeker-profile-content">
        <section className="seeker-cv-summary seeker-card">
          <div className="seeker-cv-preview" aria-label="CV preview">
            <div className="seeker-cv-preview__side">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="seeker-cv-preview__body">
              <strong>Sarah Johnson</strong>
              <span>Senior UI/UX Designer</span>
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="seeker-cv-summary__content">
            <span className="seeker-cv-summary__eyebrow">Modern template</span>
            <h2>Sarah Johnson</h2>
            <p>Senior UI/UX Designer building accessible product experiences.</p>
            <div className="seeker-cv-progress">
              <div>
                <strong>82% complete</strong>
                <span>3 sections need updates</span>
              </div>
              <span className="seeker-cv-progress__bar"><i /></span>
            </div>
            <div className="seeker-cv-summary__actions">
              <button type="button"><FaEye /> Preview</button>
              <button type="button" onClick={handleDownloadPDF}><FaDownload /> Download PDF</button>
            </div>
          </div>
        </section>

        <section className="seeker-cv-tools" aria-label="CV tools">
          <button type="button" onClick={() => setIsTemplateModalOpen(true)}>
            <FaMagic /> Choose Template
          </button>
          <button type="button"><FaLinkedin /> Import from LinkedIn</button>
          <button type="button"><FaMagic /> AI Resume Enhancement</button>
        </section>

        <nav className="seeker-cv-steps" aria-label="CV sections">
          {steps.map((step, index) => (
            <button className={index === 1 ? 'seeker-cv-step--active' : index === 0 ? 'seeker-cv-step--done' : ''} type="button" key={step}>
              <span>{index === 0 ? <FaCheck /> : index + 1}</span>
              {step}
            </button>
          ))}
        </nav>

        <section className="seeker-profile-grid">
          <div className="seeker-profile-main">
            <section className="seeker-card seeker-editor-card">
              <div className="seeker-editor-card__heading">
                <div>
                  <h2>Experience</h2>
                  <p>Add your work experience in reverse chronological order.</p>
                </div>
                <div className="seeker-editor-card__tools">
                  <button type="button" aria-label="Reorder section"><FaGripVertical /></button>
                  <button type="button" aria-label="Edit section"><FaEdit /></button>
                  <button type="button" aria-label="Add experience"><FaPlus /></button>
                </div>
              </div>

              <form className="seeker-profile-form">
                <label>
                  <span>Job Title</span>
                  <input type="text" placeholder="e.g. Senior UI/UX Designer" />
                </label>
                <label>
                  <span>Company</span>
                  <input type="text" placeholder="e.g. Google" />
                </label>
                <div className="seeker-profile-form__split">
                  <label>
                    <span>Start Date</span>
                    <div className="seeker-date-input">
                      <input type="text" placeholder="Select start date" />
                      <FaCalendarAlt />
                    </div>
                  </label>
                  <label>
                    <span>End Date</span>
                    <div className="seeker-date-input">
                      <input type="text" placeholder="Select end date" />
                      <FaCalendarAlt />
                    </div>
                  </label>
                </div>
                <label className="seeker-profile-check">
                  <input type="checkbox" defaultChecked />
                  <span>I currently work here</span>
                </label>
                <label>
                  <span>Job Description</span>
                  <div className="seeker-rich-editor">
                    <div className="seeker-rich-editor__toolbar" aria-label="Formatting toolbar">
                      <strong>B</strong>
                      <em>I</em>
                      <u>U</u>
                      <span>•</span>
                      <span>1.</span>
                      <FaEdit />
                    </div>
                    <textarea placeholder="Describe your role, key responsibilities, and achievements..." />
                  </div>
                </label>
              </form>
            </section>

            <section className="seeker-card seeker-editor-card">
              <div className="seeker-editor-card__heading">
                <div>
                  <h2>Personal details</h2>
                  <p>Keep your public candidate information accurate.</p>
                </div>
              </div>
              <div className="seeker-profile-details">
                <span><FaUser /> Sarah Johnson</span>
                <span><FaEnvelope /> sarah.johnson@example.com</span>
                <span><FaMapMarkerAlt /> New York, NY</span>
                <span><FaBriefcase /> Senior UI/UX Designer</span>
              </div>
            </section>
          </div>

          <aside className="seeker-profile-side">
            <section className="seeker-card seeker-skill-card">
              <div className="seeker-section-heading">
                <h2>Skills</h2>
                <button type="button"><FaPlus /> Add</button>
              </div>
              <div className="seeker-profile-tags">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="seeker-card seeker-skill-card">
              <div className="seeker-section-heading">
                <h2>Qualifications</h2>
                <button type="button"><FaPlus /> Add</button>
              </div>
              <div className="seeker-qualification-list">
                {qualifications.map((item) => (
                  <p key={item}><FaGraduationCap /> {item}</p>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>

      <div className="seeker-profile-actions">
        <button type="button"><FaRegSave /> Save Draft</button>
        <button type="button" onClick={handleDownloadPDF}><FaDownload /> Download CV</button>
      </div>

      {/* Template Preview Section */}
      <section className="seeker-cv-preview-section" style={{ marginTop: '3rem', display: 'none' }}>
        <h2>CV Preview ({selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template)</h2>
        <div id="cv-preview-container">
          <CVTemplateRenderer data={sampleCVData} template={selectedTemplate} />
        </div>
      </section>

      <CVTemplateSelector
        isOpen={isTemplateModalOpen}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(template) => setSelectedTemplate(template as any)}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;
