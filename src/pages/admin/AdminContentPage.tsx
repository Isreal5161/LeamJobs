import { useState } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaEye,
  FaFileAlt,
  FaLayerGroup,
  FaPlus,
  FaSave,
  FaTrash,
} from 'react-icons/fa';
import {
  useSiteContent,
  type SitePageKey,
  type SiteStat,
} from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { updateAdminSiteContent } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

type StatPageKey = 'welcome' | 'about' | 'how-it-works' | 'companies';

const pageLabels: Record<SitePageKey, { name: string; section: string }> = {
  welcome: { name: 'Welcome page', section: 'Hero, search, stats, filters' },
  about: { name: 'About page', section: 'Hero, mission, values, team' },
  features: { name: 'Features page', section: 'Hero, recommendations, feature cards' },
  'how-it-works': { name: 'How it works', section: 'Hero, process steps, results' },
  companies: { name: 'Companies page', section: 'Hero, filters, company directory' },
};

function AdminContentPage() {
  const { token } = useAuth();
  const { content, updatePage, isLoading } = useSiteContent();
  const [selectedPage, setSelectedPage] = useState<SitePageKey>('welcome');
  const [saveNotice, setSaveNotice] = useState('No content changes saved yet');
  const [isSaving, setIsSaving] = useState(false);

  const saveChanges = async () => {
    if (!token || isSaving) return;
    setIsSaving(true);
    const result = await updateAdminSiteContent(token, selectedPage, content[selectedPage]);
    setSaveNotice(result.ok ? `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : result.error.message);
    setIsSaving(false);
  };

  const updateStat = (page: StatPageKey, index: number, patch: Partial<SiteStat>) => {
    updatePage(page, (current) => ({
      ...current,
      stats: current.stats.map((stat, statIndex) => (statIndex === index ? { ...stat, ...patch } : stat)),
    }));
  };

  const addStat = (page: StatPageKey) => {
    updatePage(page, (current) => ({
      ...current,
      stats: [...current.stats, { value: '0', label: 'New stat' }],
    }));
  };

  const removeStat = (page: StatPageKey, index: number) => {
    updatePage(page, (current) => ({
      ...current,
      stats: current.stats.filter((_, statIndex) => statIndex !== index),
    }));
  };

  if (isLoading) {
    return <AdminPageSkeleton showToolbar={false} statCards={4} rows={4} />;
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Website content</span>
          <h1>Public page editor</h1>
          <p>Edit the words, sections, buttons, stats, filters, and page lists that appear across the public website.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Preview website content">
          <FaEye />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Content summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaFileAlt /></span>
          <div><strong>{Object.keys(content).length}</strong><p>public pages</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>Live</strong><p>updates apply instantly</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaLayerGroup /></span>
          <div><strong>All</strong><p>major sections editable</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaEdit /></span>
          <div><strong>{pageLabels[selectedPage].name}</strong><p>current editor</p></div>
        </article>
      </section>

      <section className="admin-grid admin-content-workspace">
        <aside className="admin-panel admin-content-pages-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaFileAlt /> Pages</span>
              <h2>Public content inventory</h2>
            </div>
          </div>
          <div className="admin-content-page-list">
            {(Object.keys(pageLabels) as SitePageKey[]).map((pageKey) => (
              <button
                type="button"
                key={pageKey}
                className={`admin-content-item ${selectedPage === pageKey ? 'admin-content-item--active' : ''}`}
                onClick={() => setSelectedPage(pageKey)}
              >
                <strong>{pageLabels[pageKey].name}</strong>
                <span>{pageLabels[pageKey].section}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="admin-panel admin-content-editor-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaEdit /> Editor</span>
              <h2>{pageLabels[selectedPage].name}</h2>
            </div>
            <button className="admin-button admin-button--primary" type="button" onClick={() => void saveChanges()} disabled={isSaving}>
              <FaSave /> {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <form className="admin-form admin-content-form" onSubmit={(event) => event.preventDefault()}>
            {selectedPage === 'welcome' ? (
              <>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Hero and search</span></div>
                  <label><span>Hero title</span><input value={content.welcome.heroTitle} onChange={(event) => updatePage('welcome', (current) => ({ ...current, heroTitle: event.target.value }))} /></label>
                  <label><span>Hero subtitle</span><textarea value={content.welcome.heroSubtitle} onChange={(event) => updatePage('welcome', (current) => ({ ...current, heroSubtitle: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Primary CTA</span><input value={content.welcome.primaryCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, primaryCta: event.target.value }))} /></label>
                    <label><span>Secondary CTA</span><input value={content.welcome.secondaryCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, secondaryCta: event.target.value }))} /></label>
                  </div>
                  <div className="admin-form__split">
                    <label><span>Employer CTA</span><input value={content.welcome.employerCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, employerCta: event.target.value }))} /></label>
                    <label><span>Filter heading</span><input value={content.welcome.filterTitle} onChange={(event) => updatePage('welcome', (current) => ({ ...current, filterTitle: event.target.value }))} /></label>
                  </div>
                  <div className="admin-form__split">
                    <label><span>Keyword placeholder</span><input value={content.welcome.keywordPlaceholder} onChange={(event) => updatePage('welcome', (current) => ({ ...current, keywordPlaceholder: event.target.value }))} /></label>
                    <label><span>Location placeholder</span><input value={content.welcome.locationPlaceholder} onChange={(event) => updatePage('welcome', (current) => ({ ...current, locationPlaceholder: event.target.value }))} /></label>
                  </div>
                  <label><span>Search button</span><input value={content.welcome.searchButton} onChange={(event) => updatePage('welcome', (current) => ({ ...current, searchButton: event.target.value }))} /></label>
                </section>

                <StatsEditor
                  stats={content.welcome.stats}
                  onAdd={() => addStat('welcome')}
                  onRemove={(index) => removeStat('welcome', index)}
                  onChange={(index, patch) => updateStat('welcome', index, patch)}
                />

                <ListEditor
                  title="Filter chips"
                  items={content.welcome.filters}
                  itemLabel="Filter"
                  onAdd={() => updatePage('welcome', (current) => ({ ...current, filters: [...current.filters, 'New filter'] }))}
                  onRemove={(index) => updatePage('welcome', (current) => ({ ...current, filters: current.filters.filter((_, itemIndex) => itemIndex !== index) }))}
                  onChange={(index, value) => updatePage('welcome', (current) => ({ ...current, filters: current.filters.map((item, itemIndex) => itemIndex === index ? value : item) }))}
                />
              </>
            ) : null}

            {selectedPage === 'about' ? (
              <>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Hero</span></div>
                  <label><span>Eyebrow</span><input value={content.about.eyebrow} onChange={(event) => updatePage('about', (current) => ({ ...current, eyebrow: event.target.value }))} /></label>
                  <label><span>Title</span><input value={content.about.title} onChange={(event) => updatePage('about', (current) => ({ ...current, title: event.target.value }))} /></label>
                  <label><span>Description</span><textarea value={content.about.description} onChange={(event) => updatePage('about', (current) => ({ ...current, description: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Primary CTA</span><input value={content.about.primaryCta} onChange={(event) => updatePage('about', (current) => ({ ...current, primaryCta: event.target.value }))} /></label>
                    <label><span>Secondary CTA</span><input value={content.about.secondaryCta} onChange={(event) => updatePage('about', (current) => ({ ...current, secondaryCta: event.target.value }))} /></label>
                  </div>
                </section>

                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Mission and values</span></div>
                  <label><span>Mission title</span><input value={content.about.missionTitle} onChange={(event) => updatePage('about', (current) => ({ ...current, missionTitle: event.target.value }))} /></label>
                  <label><span>Mission text</span><textarea value={content.about.missionText} onChange={(event) => updatePage('about', (current) => ({ ...current, missionText: event.target.value }))} /></label>
                  <label><span>Values title</span><input value={content.about.valuesTitle} onChange={(event) => updatePage('about', (current) => ({ ...current, valuesTitle: event.target.value }))} /></label>
                  {content.about.values.map((value, index) => (
                    <div className="admin-content-repeater" key={`${value.title}-${index}`}>
                      <label><span>Value title</span><input value={value.title} onChange={(event) => updatePage('about', (current) => ({ ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} /></label>
                      <label><span>Value text</span><textarea value={value.text} onChange={(event) => updatePage('about', (current) => ({ ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} /></label>
                      <button type="button" className="admin-content-remove-button" onClick={() => updatePage('about', (current) => ({ ...current, values: current.values.filter((_, itemIndex) => itemIndex !== index) }))}><FaTrash /> Remove value</button>
                    </div>
                  ))}
                  <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updatePage('about', (current) => ({ ...current, values: [...current.values, { title: 'New value', text: 'Describe this value.' }] }))}><FaPlus /> Add value</button>
                </section>

                <StatsEditor
                  stats={content.about.stats}
                  onAdd={() => addStat('about')}
                  onRemove={(index) => removeStat('about', index)}
                  onChange={(index, patch) => updateStat('about', index, patch)}
                />

                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Team and partner sections</span></div>
                  <label><span>Team title</span><input value={content.about.teamTitle} onChange={(event) => updatePage('about', (current) => ({ ...current, teamTitle: event.target.value }))} /></label>
                  <label><span>Team text</span><textarea value={content.about.teamText} onChange={(event) => updatePage('about', (current) => ({ ...current, teamText: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Team button</span><input value={content.about.teamButton} onChange={(event) => updatePage('about', (current) => ({ ...current, teamButton: event.target.value }))} /></label>
                    <label><span>More avatar label</span><input value={content.about.teamMoreLabel} onChange={(event) => updatePage('about', (current) => ({ ...current, teamMoreLabel: event.target.value }))} /></label>
                  </div>
                  <ListEditor
                    title="Team avatar initials"
                    items={content.about.team}
                    itemLabel="Initials"
                    onAdd={() => updatePage('about', (current) => ({ ...current, team: [...current.team, 'NA'] }))}
                    onRemove={(index) => updatePage('about', (current) => ({ ...current, team: current.team.filter((_, itemIndex) => itemIndex !== index) }))}
                    onChange={(index, value) => updatePage('about', (current) => ({ ...current, team: current.team.map((item, itemIndex) => itemIndex === index ? value : item) }))}
                  />
                  <label><span>Partner title</span><input value={content.about.partnerTitle} onChange={(event) => updatePage('about', (current) => ({ ...current, partnerTitle: event.target.value }))} /></label>
                  <label><span>Partner text</span><textarea value={content.about.partnerText} onChange={(event) => updatePage('about', (current) => ({ ...current, partnerText: event.target.value }))} /></label>
                  <label><span>Partner button</span><input value={content.about.partnerButton} onChange={(event) => updatePage('about', (current) => ({ ...current, partnerButton: event.target.value }))} /></label>
                </section>
              </>
            ) : null}

            {selectedPage === 'features' ? (
              <>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Hero</span></div>
                  <label><span>Hero title</span><input value={content.features.heroTitle} onChange={(event) => updatePage('features', (current) => ({ ...current, heroTitle: event.target.value }))} /></label>
                  <label><span>Hero subtitle</span><textarea value={content.features.heroSubtitle} onChange={(event) => updatePage('features', (current) => ({ ...current, heroSubtitle: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Primary CTA</span><input value={content.features.primaryCta} onChange={(event) => updatePage('features', (current) => ({ ...current, primaryCta: event.target.value }))} /></label>
                    <label><span>Secondary CTA</span><input value={content.features.secondaryCta} onChange={(event) => updatePage('features', (current) => ({ ...current, secondaryCta: event.target.value }))} /></label>
                  </div>
                </section>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Recommendation panel</span></div>
                  <label><span>Panel title</span><input value={content.features.recommendationsTitle} onChange={(event) => updatePage('features', (current) => ({ ...current, recommendationsTitle: event.target.value }))} /></label>
                  {content.features.recommendations.map((item, index) => (
                    <div className="admin-content-repeater" key={`${item.title}-${index}`}>
                      <label><span>Recommendation title</span><input value={item.title} onChange={(event) => updatePage('features', (current) => ({ ...current, recommendations: current.recommendations.map((job, jobIndex) => jobIndex === index ? { ...job, title: event.target.value } : job) }))} /></label>
                      <label><span>Recommendation meta</span><input value={item.meta} onChange={(event) => updatePage('features', (current) => ({ ...current, recommendations: current.recommendations.map((job, jobIndex) => jobIndex === index ? { ...job, meta: event.target.value } : job) }))} /></label>
                      <label><span>Match label</span><input value={item.match} onChange={(event) => updatePage('features', (current) => ({ ...current, recommendations: current.recommendations.map((job, jobIndex) => jobIndex === index ? { ...job, match: event.target.value } : job) }))} /></label>
                      <button type="button" className="admin-content-remove-button" onClick={() => updatePage('features', (current) => ({ ...current, recommendations: current.recommendations.filter((_, itemIndex) => itemIndex !== index) }))}><FaTrash /> Remove recommendation</button>
                    </div>
                  ))}
                  <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updatePage('features', (current) => ({ ...current, recommendations: [...current.recommendations, { title: 'New recommendation', meta: 'Company - Location - Type', match: '80% match' }] }))}><FaPlus /> Add recommendation</button>
                  <div className="admin-form__split">
                    <label><span>Profile score</span><input type="number" value={content.features.profileCompletion} onChange={(event) => updatePage('features', (current) => ({ ...current, profileCompletion: Number(event.target.value) || 0 }))} /></label>
                    <label><span>Profile title</span><input value={content.features.profileTitle} onChange={(event) => updatePage('features', (current) => ({ ...current, profileTitle: event.target.value }))} /></label>
                  </div>
                  <label><span>Profile text</span><textarea value={content.features.profileText} onChange={(event) => updatePage('features', (current) => ({ ...current, profileText: event.target.value }))} /></label>
                  <label><span>Profile link</span><input value={content.features.profileLink} onChange={(event) => updatePage('features', (current) => ({ ...current, profileLink: event.target.value }))} /></label>
                </section>
                {FeatureItemsEditor()}
                {CtaEditor({ page: 'features' })}
              </>
            ) : null}

            {selectedPage === 'how-it-works' ? (
              <>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Hero</span></div>
                  <label><span>Hero title</span><input value={content['how-it-works'].heroTitle} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, heroTitle: event.target.value }))} /></label>
                  <label><span>Hero subtitle</span><textarea value={content['how-it-works'].heroSubtitle} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, heroSubtitle: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Primary CTA</span><input value={content['how-it-works'].primaryCta} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, primaryCta: event.target.value }))} /></label>
                    <label><span>Secondary CTA</span><input value={content['how-it-works'].secondaryCta} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, secondaryCta: event.target.value }))} /></label>
                  </div>
                </section>
                <ListEditor
                  title="Hero step labels"
                  items={content['how-it-works'].heroStepLabels}
                  itemLabel="Step label"
                  onAdd={() => updatePage('how-it-works', (current) => ({ ...current, heroStepLabels: [...current.heroStepLabels, 'New step label'] }))}
                  onRemove={(index) => updatePage('how-it-works', (current) => ({ ...current, heroStepLabels: current.heroStepLabels.filter((_, itemIndex) => itemIndex !== index) }))}
                  onChange={(index, value) => updatePage('how-it-works', (current) => ({ ...current, heroStepLabels: current.heroStepLabels.map((item, itemIndex) => itemIndex === index ? value : item) }))}
                />
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Process steps</span></div>
                  {content['how-it-works'].steps.map((step, index) => (
                    <div className="admin-content-repeater" key={`${step.title}-${index}`}>
                      <label><span>Step title</span><input value={step.title} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} /></label>
                      <label><span>Step text</span><textarea value={step.text} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} /></label>
                      <button type="button" className="admin-content-remove-button" onClick={() => updatePage('how-it-works', (current) => ({ ...current, steps: current.steps.filter((_, itemIndex) => itemIndex !== index) }))}><FaTrash /> Remove step</button>
                    </div>
                  ))}
                  <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updatePage('how-it-works', (current) => ({ ...current, steps: [...current.steps, { title: 'New step', text: 'Describe this step.' }] }))}><FaPlus /> Add step</button>
                </section>
                <StatsEditor
                  stats={content['how-it-works'].stats}
                  onAdd={() => addStat('how-it-works')}
                  onRemove={(index) => removeStat('how-it-works', index)}
                  onChange={(index, patch) => updateStat('how-it-works', index, patch)}
                />
                {CtaEditor({ page: 'how-it-works' })}
              </>
            ) : null}

            {selectedPage === 'companies' ? (
              <>
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Hero</span></div>
                  <label><span>Hero title</span><input value={content.companies.heroTitle} onChange={(event) => updatePage('companies', (current) => ({ ...current, heroTitle: event.target.value }))} /></label>
                  <label><span>Hero subtitle</span><textarea value={content.companies.heroSubtitle} onChange={(event) => updatePage('companies', (current) => ({ ...current, heroSubtitle: event.target.value }))} /></label>
                  <div className="admin-form__split">
                    <label><span>Primary CTA</span><input value={content.companies.primaryCta} onChange={(event) => updatePage('companies', (current) => ({ ...current, primaryCta: event.target.value }))} /></label>
                    <label><span>Secondary CTA</span><input value={content.companies.secondaryCta} onChange={(event) => updatePage('companies', (current) => ({ ...current, secondaryCta: event.target.value }))} /></label>
                  </div>
                  <label><span>Company card link label</span><input value={content.companies.viewJobsLabel} onChange={(event) => updatePage('companies', (current) => ({ ...current, viewJobsLabel: event.target.value }))} /></label>
                </section>
                <ListEditor
                  title="Company filters"
                  items={content.companies.filters}
                  itemLabel="Filter"
                  onAdd={() => updatePage('companies', (current) => ({ ...current, filters: [...current.filters, 'New filter'] }))}
                  onRemove={(index) => updatePage('companies', (current) => ({ ...current, filters: current.filters.filter((_, itemIndex) => itemIndex !== index) }))}
                  onChange={(index, value) => updatePage('companies', (current) => ({ ...current, filters: current.filters.map((item, itemIndex) => itemIndex === index ? value : item) }))}
                />
                <section className="admin-content-section-card">
                  <div className="admin-content-section-card__header"><span>Company cards</span></div>
                  {content.companies.companies.map((company, index) => (
                    <div className="admin-content-repeater" key={`${company.name}-${index}`}>
                      <div className="admin-form__split">
                        <label><span>Company name</span><input value={company.name} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} /></label>
                        <label><span>Category</span><input value={company.category} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item) }))} /></label>
                      </div>
                      <div className="admin-form__split">
                        <label><span>Location</span><input value={company.location} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, location: event.target.value } : item) }))} /></label>
                        <label><span>Employees</span><input value={company.employees} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, employees: event.target.value } : item) }))} /></label>
                      </div>
                      <label><span>Logo tone</span><input value={company.tone} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, tone: event.target.value } : item) }))} /></label>
                      <button type="button" className="admin-content-remove-button" onClick={() => updatePage('companies', (current) => ({ ...current, companies: current.companies.filter((_, itemIndex) => itemIndex !== index) }))}><FaTrash /> Remove company</button>
                    </div>
                  ))}
                  <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updatePage('companies', (current) => ({ ...current, companies: [...current.companies, { name: 'New company', category: 'Category', location: 'Location', employees: 'Team size', tone: 'notion' }] }))}><FaPlus /> Add company</button>
                </section>
                <StatsEditor
                  stats={content.companies.stats}
                  onAdd={() => addStat('companies')}
                  onRemove={(index) => removeStat('companies', index)}
                  onChange={(index, patch) => updateStat('companies', index, patch)}
                />
                {CtaEditor({ page: 'companies' })}
              </>
            ) : null}

            <div className="admin-content-save-row">
              <span>{saveNotice}</span>
              <button className="admin-button admin-button--primary" type="button" onClick={() => void saveChanges()} disabled={isSaving}>
                <FaSave /> {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );

  function FeatureItemsEditor() {
    return (
      <section className="admin-content-section-card">
        <div className="admin-content-section-card__header"><span>Feature cards</span></div>
        {content.features.items.map((item, index) => (
          <div className="admin-content-repeater" key={`${item.title}-${index}`}>
            <label><span>Feature title</span><input value={item.title} onChange={(event) => updatePage('features', (current) => ({ ...current, items: current.items.map((feature, featureIndex) => featureIndex === index ? { ...feature, title: event.target.value } : feature) }))} /></label>
            <label><span>Feature text</span><textarea value={item.text} onChange={(event) => updatePage('features', (current) => ({ ...current, items: current.items.map((feature, featureIndex) => featureIndex === index ? { ...feature, text: event.target.value } : feature) }))} /></label>
            <button type="button" className="admin-content-remove-button" onClick={() => updatePage('features', (current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}><FaTrash /> Remove feature</button>
          </div>
        ))}
        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updatePage('features', (current) => ({ ...current, items: [...current.items, { title: 'New feature', text: 'Describe this feature.' }] }))}><FaPlus /> Add feature</button>
      </section>
    );
  }

  function CtaEditor({ page }: { page: 'features' | 'how-it-works' | 'companies' }) {
    const pageContent = content[page];

    return (
      <section className="admin-content-section-card">
        <div className="admin-content-section-card__header"><span>Final CTA</span></div>
        <label><span>CTA title</span><input value={pageContent.ctaTitle} onChange={(event) => updatePage(page, (current) => ({ ...current, ctaTitle: event.target.value }))} /></label>
        <label><span>CTA subtitle</span><textarea value={pageContent.ctaSubtitle} onChange={(event) => updatePage(page, (current) => ({ ...current, ctaSubtitle: event.target.value }))} /></label>
        <label><span>CTA button</span><input value={pageContent.ctaButton} onChange={(event) => updatePage(page, (current) => ({ ...current, ctaButton: event.target.value }))} /></label>
      </section>
    );
  }
}

function StatsEditor({
  stats,
  onAdd,
  onRemove,
  onChange,
}: {
  stats: SiteStat[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<SiteStat>) => void;
}) {
  return (
    <section className="admin-content-section-card">
      <div className="admin-content-section-card__header">
        <span>Stats</span>
        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={onAdd}><FaPlus /> Add stat</button>
      </div>
      {stats.map((stat, index) => (
        <div className="admin-content-repeater admin-content-repeater--inline" key={`${stat.label}-${index}`}>
          <label><span>Value</span><input value={stat.value} onChange={(event) => onChange(index, { value: event.target.value })} /></label>
          <label><span>Label</span><input value={stat.label} onChange={(event) => onChange(index, { label: event.target.value })} /></label>
          <button type="button" className="admin-content-icon-remove" aria-label={`Remove stat ${index + 1}`} onClick={() => onRemove(index)}><FaTrash /></button>
        </div>
      ))}
    </section>
  );
}

function ListEditor({
  title,
  items,
  itemLabel,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  items: string[];
  itemLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <section className="admin-content-section-card">
      <div className="admin-content-section-card__header">
        <span>{title}</span>
        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={onAdd}><FaPlus /> Add</button>
      </div>
      <div className="admin-content-token-editor">
        {items.map((item, index) => (
          <div className="admin-content-repeater admin-content-repeater--inline" key={`${item}-${index}`}>
            <label><span>{itemLabel}</span><input value={item} onChange={(event) => onChange(index, event.target.value)} /></label>
            <button type="button" className="admin-content-icon-remove" aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`} onClick={() => onRemove(index)}><FaTrash /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminContentPage;
