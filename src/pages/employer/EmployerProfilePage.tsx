import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  FaBell, FaBriefcase, FaBuilding, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaRegSave, FaUsers,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getEmployerProfile, updateEmployerProfile, type EmployerProfile, type EmployerProfilePayload } from '../../services/api';

type ProfileForm = {
  companyName: string;
  companyDescription: string;
  website: string;
  industry: string;
  companySize: string;
  location: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

const emptyForm: ProfileForm = {
  companyName: '',
  companyDescription: '',
  website: '',
  industry: '',
  companySize: '',
  location: '',
};

const formFromProfile = (profile: EmployerProfile): ProfileForm => ({
  companyName: profile.companyName ?? '',
  companyDescription: profile.companyDescription ?? '',
  website: profile.website ?? '',
  industry: profile.industry ?? '',
  companySize: profile.companySize ?? '',
  location: profile.location ?? '',
});

const initialsFor = (companyName: string) => companyName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

function EmployerProfilePage() {
  const { token } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setIsLoading(true);
    setError('');
    void getEmployerProfile(token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load your company profile.');
      } else {
        setEmail(result.data.data.account.email);
        setForm(result.data.data.profile ? formFromProfile(result.data.data.profile) : emptyForm);
        setLogoUrl(result.data.data.profile?.companyLogoUrl ?? null);
      }
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey, token]);

  const setField = <Field extends keyof ProfileForm>(field: Field, value: ProfileForm[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setSaveMessage('');
  };

  const validate = () => {
    const errors: FormErrors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
    if (form.companyName.trim().length > 160) errors.companyName = 'Company name must be 160 characters or fewer.';
    if (form.companyDescription.trim().length > 5000) errors.companyDescription = 'Company description must be 5000 characters or fewer.';
    if (form.industry.trim().length > 120) errors.industry = 'Industry must be 120 characters or fewer.';
    if (form.companySize.trim().length > 100) errors.companySize = 'Company size must be 100 characters or fewer.';
    if (form.location.trim().length > 160) errors.location = 'Location must be 160 characters or fewer.';
    if (form.website.trim()) {
      try {
        new URL(form.website.trim());
      } catch {
        errors.website = 'Website must be a valid URL.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || isSaving || !validate()) return;
    setIsSaving(true);
    setError('');
    setSaveMessage('');
    const payload: EmployerProfilePayload = {
      companyName: form.companyName.trim(),
      companyDescription: form.companyDescription.trim() || null,
      website: form.website.trim() || null,
      industry: form.industry.trim() || null,
      companySize: form.companySize.trim() || null,
      location: form.location.trim() || null,
    };
    const result = await updateEmployerProfile(payload, token);
    if (!result.ok) {
      setError(result.error.message || 'We could not save your company profile.');
    } else {
      const savedProfile = result.data.data.profile;
      if (!savedProfile) {
        setError('The saved company profile was not returned.');
      } else {
        setForm(formFromProfile(savedProfile));
        setEmail(result.data.data.account.email);
        setLogoUrl(savedProfile.companyLogoUrl);
        setSaveMessage('Company profile saved.');
      }
    }
    setIsSaving(false);
  };

  const brandInitials = useMemo(() => initialsFor(form.companyName), [form.companyName]);
  const websiteLabel = form.website ? form.website.replace(/^https?:\/\//, '') : 'Not provided';
  const companyLabel = form.companyName || 'Company name not provided';

  if (isLoading) {
    return (
      <div className="employer-page" aria-live="polite" aria-label="Loading company profile">
        <section className="employer-hero employer-hero--compact">
          <div className="employer-hero__top">
            <div>
              <span className="employer-eyebrow">Company profile</span>
              <h1>Complete your company profile</h1>
              <p>Keep the company information shown beside your job posts accurate.</p>
            </div>
            <span className="leamjobs-skeleton-block" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          </div>
        </section>

        <main className="employer-content employer-profile-grid">
          <section className="employer-panel employer-company-card" aria-hidden="true">
            <span className="employer-company-card__logo leamjobs-skeleton-block" style={{ width: '64px', height: '64px', borderRadius: '18px' }} />
            <div>
              <span className="leamjobs-skeleton-line" style={{ width: '58%', height: '1.05rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '90%', height: '0.85rem', marginTop: '0.55rem' }} />
            </div>
            <span className="employer-profile-deferred leamjobs-skeleton-line" style={{ width: '76%', height: '0.85rem', marginTop: '1rem' }} />
          </section>

          <section className="employer-panel" aria-hidden="true">
            <div className="employer-section-heading">
              <div>
                <span className="leamjobs-skeleton-line" style={{ width: '40%', height: '0.95rem' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '52%', height: '1.1rem', marginTop: '0.35rem' }} />
              </div>
              <span className="leamjobs-skeleton-block" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
            </div>

            <div className="employer-form">
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '0.8rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '0.8rem' }} />
              <div className="employer-form__split">
                <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px' }} />
              </div>
              <div className="employer-form__split">
                <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px' }} />
              </div>
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '96px', marginTop: '0.8rem' }} />
            </div>
          </section>

          <aside className="employer-panel employer-profile-facts" aria-hidden="true">
            <span className="leamjobs-skeleton-line" style={{ width: '44%', height: '1.15rem' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '80px', marginTop: '0.8rem' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '72%', height: '0.9rem', marginTop: '0.8rem' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '70%', height: '0.9rem', marginTop: '0.55rem' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '76%', height: '0.9rem', marginTop: '0.55rem' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '68%', height: '0.9rem', marginTop: '0.55rem' }} />
          </aside>
        </main>
      </div>
    );
  }

  if (error && !email) {
    return <div className="employer-page employer-empty-state" role="alert"><strong>Company profile unavailable</strong><p>{error}</p><button className="employer-button employer-button--ghost" type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>;
  }

  return (
    <div className="employer-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div><span className="employer-eyebrow">Company profile</span><h1>Complete your company profile</h1><p>Keep the company information shown beside your job posts accurate.</p></div>
          <button className="employer-icon-button" type="button" aria-label="Notifications"><FaBell /></button>
        </div>
      </section>

      <main className="employer-content employer-profile-grid">
        <section className="employer-panel employer-company-card">
          <span className="employer-company-card__logo">{logoUrl ? <img src={logoUrl} alt="" /> : brandInitials || 'Logo'}</span>
          <div><h2>{companyLabel}</h2><p>{form.companyDescription || 'Company description not provided'}</p></div>
          <span className="employer-profile-deferred">Logo upload is not available yet.</span>
        </section>

        <section className="employer-panel">
          <div className="employer-section-heading"><div><h2>Company details</h2><p>These fields are stored on your employer profile.</p></div><FaBuilding /></div>
          <form className="employer-form" onSubmit={saveProfile} noValidate>
            {error ? <p className="employer-action-error" role="alert">{error}</p> : null}
            {saveMessage ? <p className="employer-profile-success" role="status">{saveMessage}</p> : null}
            <label><span>Company name</span><input required maxLength={160} type="text" value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} aria-invalid={Boolean(fieldErrors.companyName)} placeholder="Your company name" />{fieldErrors.companyName ? <small role="alert">{fieldErrors.companyName}</small> : null}</label>
            <label><span>Company email <small>(account email, read-only)</small></span><input type="email" value={email} readOnly aria-readonly="true" /></label>
            <div className="employer-form__split"><label><span>Website</span><input type="url" value={form.website} onChange={(event) => setField('website', event.target.value)} aria-invalid={Boolean(fieldErrors.website)} placeholder="https://example.com" />{fieldErrors.website ? <small role="alert">{fieldErrors.website}</small> : null}</label><label><span>Industry</span><input type="text" maxLength={120} value={form.industry} onChange={(event) => setField('industry', event.target.value)} aria-invalid={Boolean(fieldErrors.industry)} placeholder="Industry" />{fieldErrors.industry ? <small role="alert">{fieldErrors.industry}</small> : null}</label></div>
            <div className="employer-form__split"><label><span>Company size</span><input type="text" maxLength={100} value={form.companySize} onChange={(event) => setField('companySize', event.target.value)} aria-invalid={Boolean(fieldErrors.companySize)} placeholder="e.g. 11-50 employees" />{fieldErrors.companySize ? <small role="alert">{fieldErrors.companySize}</small> : null}</label><label><span>Location</span><input type="text" maxLength={160} value={form.location} onChange={(event) => setField('location', event.target.value)} aria-invalid={Boolean(fieldErrors.location)} placeholder="City, country" />{fieldErrors.location ? <small role="alert">{fieldErrors.location}</small> : null}</label></div>
            <label><span>Company description</span><textarea maxLength={5000} rows={6} value={form.companyDescription} onChange={(event) => setField('companyDescription', event.target.value)} aria-invalid={Boolean(fieldErrors.companyDescription)} placeholder="Describe your company for candidates." />{fieldErrors.companyDescription ? <small role="alert">{fieldErrors.companyDescription}</small> : null}</label>
            <div className="employer-editor-actions"><button className="employer-button employer-button--primary" type="submit" disabled={isSaving}><FaRegSave /> {isSaving ? 'Saving...' : 'Save profile'}</button></div>
          </form>
        </section>

        <aside className="employer-panel employer-profile-facts">
          <h2>Public preview</h2>
          <div className="employer-brand-preview"><span className="employer-brand-preview__logo">{logoUrl ? <img src={logoUrl} alt="" /> : brandInitials || 'Logo'}</span><strong>{companyLabel}</strong><p>{form.companyDescription || 'Description not provided'}</p></div>
          <span><FaMapMarkerAlt /> {form.location || 'Location not provided'}</span>
          <span><FaUsers /> {form.companySize || 'Company size not provided'}</span>
          <span><FaBriefcase /> {form.industry || 'Industry not provided'}</span>
          <span><FaGlobe /> {websiteLabel}</span>
          <span><FaEnvelope /> {email || 'Account email not available'}</span>
        </aside>
      </main>
    </div>
  );
}

export default EmployerProfilePage;
