import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getSeekerProfile, updateSeekerProfile } from '../../services/api';
import { professionSuggestions } from '../../data/professionSuggestions';

const COUNTRY_OPTIONS = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'United Arab Emirates',
  'India',
];

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT - Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const PREDEFINED_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express.js',
  'Python',
  'Django',
  'Java',
  'PHP',
  'Laravel',
  'C#',
  '.NET',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'HTML',
  'CSS',
  'Tailwind CSS',
  'UI/UX Design',
  'Figma',
  'Graphic Design',
  'Product Design',
  'Data Analysis',
  'Data Science',
  'Machine Learning',
  'Digital Marketing',
  'SEO',
  'Content Writing',
  'Copywriting',
  'Project Management',
  'Customer Service',
  'Microsoft Excel',
  'Accounting',
  'Sales',
];

type FormState = {
  country: string;
  stateOrRegion: string;
  city: string;
  professionalTitle: string;
  skills: string[];
};

type FormErrors = Partial<Record<'country' | 'state' | 'city' | 'professionalTitle' | 'skills' | 'form', string>>;

const emptyForm: FormState = {
  country: '',
  stateOrRegion: '',
  city: '',
  professionalTitle: '',
  skills: [],
};

function normalizeSkill(skill: string) {
  return skill.trim();
}

function hasSkill(skills: string[], skill: string) {
  return skills.some((existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase());
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [professionQuery, setProfessionQuery] = useState('');
  const [isProfessionOpen, setIsProfessionOpen] = useState(false);

  const firstName = user?.firstName || 'there';

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!token) {
        if (isMounted) {
          setErrors((current) => ({ ...current, form: 'Your session could not be loaded. Please sign in again.' }));
          setIsLoadingProfile(false);
        }
        return;
      }

      const result = await getSeekerProfile(token);

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        const message = result.status === 401
          ? 'Your session has expired. Please sign in again.'
          : result.status === 403
            ? 'You do not have permission to complete seeker onboarding.'
            : 'We could not load your profile right now. Please try again.';

        setErrors((current) => ({ ...current, form: message }));
        setIsLoadingProfile(false);
        return;
      }

      const profile = result.data.data.profile;

      setForm({
        country: profile.country ?? '',
        stateOrRegion: profile.state ?? '',
        city: profile.city ?? '',
        professionalTitle: profile.professionalTitle ?? '',
        skills: Array.isArray(profile.skills) ? profile.skills : [],
      });
      setIsLoadingProfile(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const addSkill = (nextSkill: string) => {
    const normalizedSkill = normalizeSkill(nextSkill);

    if (!normalizedSkill) {
      setErrors((current) => ({ ...current, skills: 'Enter a skill to add.' }));
      return;
    }

    if (hasSkill(form.skills, normalizedSkill)) {
      setErrors((current) => ({ ...current, skills: 'This skill is already selected.' }));
      return;
    }

    setForm((current) => ({
      ...current,
      skills: [...current.skills, normalizedSkill],
    }));
    setCustomSkill('');
    setErrors((current) => ({ ...current, skills: undefined }));
  };

  const removeSkill = (skillToRemove: string) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.toLowerCase() !== skillToRemove.toLowerCase()),
    }));
    setErrors((current) => ({ ...current, skills: undefined }));
  };

  const toggleSkill = (skill: string) => {
    const normalizedSkill = normalizeSkill(skill);
    const existingSkill = form.skills.find((currentSkill) => currentSkill.toLowerCase() === normalizedSkill.toLowerCase());

    if (existingSkill) {
      removeSkill(existingSkill);
      return;
    }

    setForm((current) => ({ ...current, skills: [...current.skills, normalizedSkill] }));
    setErrors((current) => ({ ...current, skills: undefined }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.country.trim()) {
      nextErrors.country = 'Please select your country.';
    }

    if (!form.stateOrRegion.trim()) {
      nextErrors.state = 'Please enter your state or region.';
    }

    if (!form.city.trim()) {
      nextErrors.city = 'Please enter your city.';
    }

    if (!form.professionalTitle.trim()) {
      nextErrors.professionalTitle = 'Please enter your professional title.';
    }

    if (form.skills.length === 0) {
      nextErrors.skills = 'Add at least one skill.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setErrors((current) => ({ ...current, form: 'Your session could not be loaded. Please sign in again.' }));
      return;
    }

    const payload = {
      country: form.country.trim(),
      state: form.stateOrRegion.trim(),
      city: form.city.trim(),
      professionalTitle: form.professionalTitle.trim(),
      skills: form.skills.map((skill) => normalizeSkill(skill)),
    };

    setIsSaving(true);
    setErrors((current) => ({ ...current, form: undefined }));

    const result = await updateSeekerProfile(payload, token);

    setIsSaving(false);

    if (!result.ok) {
      let message = 'Unable to save your profile right now. Please try again.';

      if (result.status === 401) {
        message = 'Your session has expired. Please sign in again.';
      } else if (result.status === 403) {
        message = 'You do not have permission to complete seeker onboarding.';
      } else if (result.status === 400) {
        message = result.error.message || 'Please review the information and try again.';
      }

      setErrors((current) => ({ ...current, form: message }));
      return;
    }

    navigate('/seeker/dashboard', { replace: true });
  };

  const isNigeria = form.country === 'Nigeria';
  const filteredProfessions = professionSuggestions.filter((profession) => profession.toLocaleLowerCase().includes(professionQuery.trim().toLocaleLowerCase())).slice(0, 8);

  return (
    <div className="seeker-onboarding-page">
      <div className="seeker-onboarding-shell">
        <header className="seeker-onboarding-header">
          <div className="seeker-onboarding-badge">Profile setup</div>
          <h1>Complete your profile</h1>
          <p>Tell us a little about yourself so we can personalize your job recommendations.</p>
        </header>

        {errors.form ? (
          <div className="seeker-onboarding-alert" role="alert">{errors.form}</div>
        ) : null}

        {isLoadingProfile ? (
          <div className="seeker-onboarding-loading" role="status" aria-live="polite" aria-label="Loading your profile">
            <div className="seeker-onboarding-welcome" aria-hidden="true">
              <span className="leamjobs-skeleton-circle" style={{ width: '42px', height: '42px' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '45%', height: '1.3rem' }} />
            </div>
            <div className="seeker-onboarding-grid" aria-hidden="true">
              {[1, 2, 3, 4].map((item) => (
                <div className="seeker-onboarding-field" key={item}>
                  <span className="leamjobs-skeleton-line" style={{ width: '35%' }} />
                  <span className="leamjobs-skeleton-block" style={{ height: '44px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form className="seeker-onboarding-form" onSubmit={handleSubmit} noValidate>
            <div className="seeker-onboarding-welcome">
              <span className="seeker-onboarding-user-badge" aria-hidden="true">
                <FaUser />
              </span>
              <h2>Welcome, {firstName}!</h2>
            </div>

            <div className="seeker-onboarding-grid">
              <label className="seeker-onboarding-field">
                <span>Country</span>
                <select
                  value={form.country}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setForm((current) => ({ ...current, country: nextValue, stateOrRegion: nextValue === 'Nigeria' ? current.stateOrRegion : current.stateOrRegion }));
                    clearFieldError('country');
                  }}
                  aria-invalid={Boolean(errors.country)}
                >
                  <option value="">Select your country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country ? <small role="alert">{errors.country}</small> : null}
              </label>

              <label className="seeker-onboarding-field">
                <span>State / Region</span>
                {isNigeria ? (
                  <select
                    value={form.stateOrRegion}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, stateOrRegion: event.target.value }));
                      clearFieldError('state');
                    }}
                    aria-invalid={Boolean(errors.state)}
                  >
                    <option value="">Select your state</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.stateOrRegion}
                    placeholder="Enter your state or region"
                    onChange={(event) => {
                      setForm((current) => ({ ...current, stateOrRegion: event.target.value }));
                      clearFieldError('state');
                    }}
                    aria-invalid={Boolean(errors.state)}
                  />
                )}
                {errors.state ? <small role="alert">{errors.state}</small> : null}
              </label>
            </div>

            <label className="seeker-onboarding-field">
              <span>City</span>
              <input
                type="text"
                value={form.city}
                placeholder="Enter your city"
                onChange={(event) => {
                  setForm((current) => ({ ...current, city: event.target.value }));
                  clearFieldError('city');
                }}
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city ? <small role="alert">{errors.city}</small> : null}
            </label>

            <div className="seeker-onboarding-field seeker-combobox">
              <label htmlFor="profession-search">What type of work do you do?</label>
              <input id="profession-search" type="text" value={professionQuery || form.professionalTitle} placeholder="Search your profession or type your own" onFocus={() => setIsProfessionOpen(true)} onChange={(event) => { setProfessionQuery(event.target.value); setForm((current) => ({ ...current, professionalTitle: event.target.value })); clearFieldError('professionalTitle'); }} onKeyDown={(event) => { if (event.key === 'Escape') setIsProfessionOpen(false); if (event.key === 'Enter' && filteredProfessions[0]) { event.preventDefault(); setForm((current) => ({ ...current, professionalTitle: filteredProfessions[0] })); setProfessionQuery(filteredProfessions[0]); setIsProfessionOpen(false); } }} aria-invalid={Boolean(errors.professionalTitle)} />
              {isProfessionOpen && filteredProfessions.length > 0 && <div className="seeker-combobox__options" role="listbox">{filteredProfessions.map((profession) => <button type="button" role="option" key={profession} onMouseDown={(event) => event.preventDefault()} onClick={() => { setForm((current) => ({ ...current, professionalTitle: profession })); setProfessionQuery(profession); setIsProfessionOpen(false); }}>{profession}</button>)}</div>}
              {errors.professionalTitle ? <small role="alert">{errors.professionalTitle}</small> : null}
            </div>

            <div className="seeker-onboarding-field seeker-onboarding-field--skills">
              <span>Skills</span>

              <div className="seeker-onboarding-skill-list" aria-label="Available skills">
                {PREDEFINED_SKILLS.map((skill) => {
                  const isSelected = form.skills.some((currentSkill) => currentSkill.toLowerCase() === skill.toLowerCase());

                  return (
                    <button
                      key={skill}
                      type="button"
                      className={isSelected ? 'seeker-onboarding-skill seeker-onboarding-skill--selected' : 'seeker-onboarding-skill'}
                      onClick={() => toggleSkill(skill)}
                      aria-pressed={isSelected}
                    >
                      {skill}
                      {isSelected ? <FaTimes aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="seeker-onboarding-selected-skills" aria-live="polite">
                {form.skills.length === 0 ? (
                  <p className="seeker-onboarding-empty-state">No skills selected yet.</p>
                ) : (
                  form.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="seeker-onboarding-selected-skill"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill}
                      <FaTimes aria-hidden="true" />
                    </button>
                  ))
                )}
              </div>

              <div className="seeker-onboarding-custom-skill-row">
                <label className="seeker-onboarding-custom-skill-label">
                  <span>Can't find your skill?</span>
                  <input
                    type="text"
                    value={customSkill}
                    placeholder="Add a custom skill"
                    onChange={(event) => {
                      setCustomSkill(event.target.value);
                      clearFieldError('skills');
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="seeker-onboarding-add-skill-button"
                  onClick={() => addSkill(customSkill)}
                >
                  <FaPlus /> Add skill
                </button>
              </div>

              {errors.skills ? <small role="alert">{errors.skills}</small> : null}
            </div>

            <button type="submit" className="seeker-onboarding-submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;
