import { ChangeEvent, useMemo, useState } from 'react';
import {
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCamera,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaPalette,
  FaRegSave,
  FaUsers,
} from 'react-icons/fa';

function EmployerProfilePage() {
  const [logoPreview, setLogoPreview] = useState('');
  const [companyName, setCompanyName] = useState('LeamJobs Studio');
  const [industry, setIndustry] = useState('HR Technology');
  const [location, setLocation] = useState('New York, NY');
  const [employeeSize, setEmployeeSize] = useState('51-200 employees');
  const [website, setWebsite] = useState('https://leamjobs.com');
  const [email, setEmail] = useState('hiring@leamjobs.com');
  const [tagline, setTagline] = useState('Modern hiring workflows for ambitious teams.');
  const [summary, setSummary] = useState('We build focused tools for hiring teams and high-intent candidates.');

  const brandInitials = useMemo(
    () => companyName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CO',
    [companyName]
  );

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
  }

  return (
    <div className="employer-page">
      <section className="employer-hero employer-hero--compact">
          <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Company profile</span>
            <h1>Hiring brand settings</h1>
            <p>Upload your company logo and keep your public hiring brand polished.</p>
          </div>
          <div className="employer-hero__actions">
            <button className="employer-icon-button" type="button" aria-label="Notifications">
              <FaBell />
            </button>
            <button className="employer-button employer-button--light" type="button">
              <FaRegSave />
              Save Profile
            </button>
          </div>
        </div>
      </section>

      <main className="employer-content employer-profile-grid">
        <section className="employer-panel employer-company-card">
          <span className="employer-company-card__logo">
            {logoPreview ? <img src={logoPreview} alt="" /> : brandInitials}
          </span>
          <div>
            <h2>{companyName}</h2>
            <p>{tagline}</p>
          </div>
          <label className="employer-logo-upload">
            <FaCamera />
            Upload logo
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
        </section>

        <section className="employer-panel">
          <div className="employer-section-heading">
            <div>
              <h2>Company details</h2>
              <p>This information appears beside your public job posts.</p>
            </div>
            <button className="employer-button employer-button--primary" type="button">
              <FaRegSave />
              Save
            </button>
          </div>
          <form className="employer-form">
            <label>
              <span>Company name</span>
              <input type="text" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            </label>
            <div className="employer-form__split">
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                <span>Website</span>
                <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>
            </div>
            <div className="employer-form__split">
              <label>
                <span>Industry</span>
                <input type="text" value={industry} onChange={(event) => setIndustry(event.target.value)} />
              </label>
              <label>
                <span>Company size</span>
                <select value={employeeSize} onChange={(event) => setEmployeeSize(event.target.value)}>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </select>
              </label>
            </div>
            <label>
              <span>Headquarters</span>
              <input type="text" value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label>
              <span>Brand tagline</span>
              <input type="text" value={tagline} onChange={(event) => setTagline(event.target.value)} />
            </label>
            <label>
              <span>Company summary</span>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
            </label>
          </form>
        </section>

        <section className="employer-panel">
          <div className="employer-section-heading">
            <div>
              <h2>Brand and hiring voice</h2>
              <p>Shape how candidates understand your company before applying.</p>
            </div>
            <FaPalette />
          </div>
          <form className="employer-form">
            <label>
              <span>Hiring team name</span>
              <input type="text" defaultValue="Talent Acquisition" />
            </label>
            <label>
              <span>Culture highlights</span>
              <textarea defaultValue="Flexible work, focused teams, thoughtful career growth, and strong product craft." />
            </label>
            <label>
              <span>Benefits</span>
              <textarea defaultValue="Health coverage, remote stipend, learning budget, paid parental leave, and performance bonuses." />
            </label>
            <div className="employer-editor-actions">
              <button className="employer-button employer-button--primary" type="button">
                <FaRegSave />
                Save Profile
              </button>
            </div>
          </form>
        </section>

        <aside className="employer-panel employer-profile-facts">
          <h2>Public preview</h2>
          <div className="employer-brand-preview">
            <span className="employer-brand-preview__logo">
              {logoPreview ? <img src={logoPreview} alt="" /> : brandInitials}
            </span>
            <strong>{companyName}</strong>
            <p>{summary}</p>
          </div>
          <span><FaMapMarkerAlt /> {location}</span>
          <span><FaUsers /> {employeeSize}</span>
          <span><FaBriefcase /> {industry}</span>
          <span><FaGlobe /> {website.replace(/^https?:\/\//, '')}</span>
          <span><FaEnvelope /> {email}</span>
        </aside>
      </main>
    </div>
  );
}

export default EmployerProfilePage;
