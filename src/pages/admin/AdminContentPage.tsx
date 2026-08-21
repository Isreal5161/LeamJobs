import { useState } from 'react';
import { FaEdit, FaEye, FaSave } from 'react-icons/fa';
import { websitePages } from './adminData';

function AdminContentPage() {
  const [pages, setPages] = useState(websitePages);
  const [selectedPageId, setSelectedPageId] = useState(pages[0].id);
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <span className="admin-kicker">Website content</span>
        <h1>Edit public pages</h1>
        <p>Manage welcome page copy, hero sections, company page content, feature pages, and other public-facing content.</p>
      </section>

      <section className="admin-console-grid admin-console-grid--wide">
        <div className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaEye /> Pages</span>
              <h2>Public content inventory</h2>
            </div>
          </div>
          <div className="admin-content-list">
            {pages.map((page) => (
              <button
                className={page.id === selectedPageId ? 'admin-content-item admin-content-item--active' : 'admin-content-item'}
                type="button"
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
              >
                <strong>{page.page}</strong>
                <span>{page.section}</span>
                <small>{page.status}</small>
              </button>
            ))}
          </div>
        </div>

        <form className="admin-console-panel admin-editor-form">
          <div className="admin-section-heading">
            <div>
              <span><FaEdit /> Editor</span>
              <h2>{selectedPage.page}</h2>
            </div>
            <button className="admin-button admin-button--primary" type="button"><FaSave /> Save</button>
          </div>
          <label>
            <span>Page title or hero headline</span>
            <input
              value={selectedPage.title}
              onChange={(event) =>
                setPages((current) =>
                  current.map((page) => (page.id === selectedPage.id ? { ...page, title: event.target.value } : page))
                )
              }
            />
          </label>
          <label>
            <span>Section</span>
            <input
              value={selectedPage.section}
              onChange={(event) =>
                setPages((current) =>
                  current.map((page) => (page.id === selectedPage.id ? { ...page, section: event.target.value } : page))
                )
              }
            />
          </label>
          <label>
            <span>Content notes</span>
            <textarea placeholder="Update supporting text, CTAs, company highlights, feature copy, or review notes." />
          </label>
        </form>
      </section>
    </div>
  );
}

export default AdminContentPage;
