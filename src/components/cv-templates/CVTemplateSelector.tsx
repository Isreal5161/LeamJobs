import { FaTimes } from 'react-icons/fa';
import './cv-templates.css';

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  style: 'modern' | 'professional' | 'creative' | 'minimalist';
  preview: string;
}

const TEMPLATES: CVTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with color accents',
    style: 'modern',
    preview: 'Modern template with sidebar and modern typography',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Classic design for traditional industries',
    style: 'professional',
    preview: 'Professional template with traditional layout',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold, visually interesting design for creative roles',
    style: 'creative',
    preview: 'Creative template with unique visual elements',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple, focused design without distractions',
    style: 'minimalist',
    preview: 'Minimalist template with clean whitespace',
  },
];

interface CVTemplateSelectorProps {
  isOpen: boolean;
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

function CVTemplateSelector({
  isOpen,
  selectedTemplate,
  onSelectTemplate,
  onClose,
}: CVTemplateSelectorProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="cv-template-overlay" onClick={onClose} />
      <div className="cv-template-modal">
        <div className="cv-template-modal__header">
          <h2>Choose Your CV Template</h2>
          <button type="button" className="cv-template-modal__close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="cv-template-grid">
          {TEMPLATES.map((template) => (
            <div key={template.id} className="cv-template-card">
              <div className="cv-template-preview">
                <div className={`cv-preview-${template.style}`}>
                  <div className="cv-preview-placeholder">{template.preview}</div>
                </div>
              </div>
              <div className="cv-template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
              <button
                type="button"
                className={`cv-template-select-btn ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
              >
                {selectedTemplate === template.id ? '✓ Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CVTemplateSelector;
export { TEMPLATES };
