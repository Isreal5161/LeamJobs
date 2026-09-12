import { type FormEvent } from 'react';
import { FaCheckCircle, FaPlus, FaTrashAlt } from 'react-icons/fa';
import type { JobForm as JobFormState } from './jobFormUtils';
import { listFields } from './jobFormUtils';

type JobFormProps = {
  form: JobFormState;
  validationErrors: Record<string, string>;
  isCreating: boolean;
  isSaving: boolean;
  onFieldChange: <Field extends keyof JobFormState>(field: Field, value: JobFormState[Field]) => void;
  onListFieldChange: (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', index: number, value: string) => void;
  onAddListField: (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits') => void;
  onRemoveListField: (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onDepartmentChange?: (value: string) => void;
};

export function JobForm({
  form,
  validationErrors,
  isCreating,
  isSaving,
  onFieldChange,
  onListFieldChange,
  onAddListField,
  onRemoveListField,
  onSubmit,
  onCancel,
  onDepartmentChange,
}: JobFormProps) {
  return (
    <form className="employer-form" onSubmit={onSubmit} noValidate>
      <div className="employer-form__section">
        <h3>Basic information</h3>

        <label className="employer-form__field">
          <span>Job title</span>
          <input
            id="title"
            aria-invalid={Boolean(validationErrors.title)}
            aria-describedby={validationErrors.title ? 'title-error' : undefined}
            value={form.title}
            onChange={(event) => onFieldChange('title', event.target.value)}
            placeholder="Senior Product Designer"
          />
          {validationErrors.title ? (
            <span id="title-error" className="employer-form__error" role="alert">
              {validationErrors.title}
            </span>
          ) : null}
        </label>

        <div className="employer-form__split">
          <label className="employer-form__field">
            <span>Department</span>
            <select
              id="departmentChoice"
              value={form.departmentChoice}
              onChange={(event) => {
                onFieldChange('departmentChoice', event.target.value);
                if (onDepartmentChange) onDepartmentChange(event.target.value);
              }}
            >
              <option value="">Select department</option>
              {['Accounting', 'Administration', 'Advertising', 'Agriculture', 'Architecture', 'Banking', 'Business Development', 'Customer Service', 'Data & Analytics', 'Design', 'Education', 'Engineering', 'Finance', 'Healthcare', 'Human Resources', 'Information Technology', 'Legal', 'Logistics', 'Manufacturing', 'Marketing', 'Media & Communications', 'Operations', 'Procurement', 'Product Management', 'Project Management', 'Public Relations', 'Quality Assurance', 'Real Estate', 'Research', 'Sales', 'Security', 'Software Development', 'Supply Chain', 'Telecommunications', 'Training', 'Transportation', 'Other'].map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="employer-form__field">
            <span>Location</span>
            <input
              id="location"
              aria-invalid={Boolean(validationErrors.location)}
              aria-describedby={validationErrors.location ? 'location-error' : undefined}
              value={form.location}
              onChange={(event) => onFieldChange('location', event.target.value)}
              placeholder="Lagos, Nigeria"
            />
            {validationErrors.location ? (
              <span id="location-error" className="employer-form__error" role="alert">
                {validationErrors.location}
              </span>
            ) : null}
          </label>
        </div>

        {form.departmentChoice === 'Other' ? (
          <label className="employer-form__field employer-form__field--inline">
            <span>Enter department</span>
            <input
              id="departmentCustom"
              aria-invalid={Boolean(validationErrors.departmentCustom)}
              aria-describedby={validationErrors.departmentCustom ? 'departmentCustom-error' : undefined}
              value={form.departmentCustom}
              onChange={(event) => onFieldChange('departmentCustom', event.target.value)}
              placeholder="e.g. Cybersecurity"
            />
            {validationErrors.departmentCustom ? (
              <span id="departmentCustom-error" className="employer-form__error" role="alert">
                {validationErrors.departmentCustom}
              </span>
            ) : null}
          </label>
        ) : null}
      </div>

      <div className="employer-form__section">
        <h3>Job details</h3>

        <div className="employer-form__split">
          <label className="employer-form__field">
            <span>Work arrangement</span>
            <select value={form.workArrangement} onChange={(event) => onFieldChange('workArrangement', event.target.value as JobFormState['workArrangement'])}>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </label>

          <label className="employer-form__field">
            <span>Engagement type</span>
            <select value={form.engagementType} onChange={(event) => onFieldChange('engagementType', event.target.value as JobFormState['engagementType'])}>
              <option value="MONTHLY">Monthly</option>
              <option value="CONTRACT">Contract</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </label>
        </div>

        <label className="employer-form__field">
          <span>Job overview</span>
          <textarea
            id="description"
            aria-invalid={Boolean(validationErrors.description)}
            aria-describedby={validationErrors.description ? 'description-error' : undefined}
            value={form.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            placeholder="Describe the role, team, and what success looks like."
          />
          {validationErrors.description ? (
            <span id="description-error" className="employer-form__error" role="alert">
              {validationErrors.description}
            </span>
          ) : null}
        </label>

        {listFields.map(([field, label]) => (
          <div className="employer-form__detail-section" key={field}>
            <span className="employer-form__detail-heading">{label}</span>
            <div className="employer-detail-list-editor">
              {form[field].map((item, index) => (
                <div className="employer-detail-list-editor__row" key={`${field}-${index}`}>
                  <input
                    id={`${field}-${index}`}
                    value={item}
                    onChange={(event) => onListFieldChange(field, index, event.target.value)}
                    placeholder={`${label.replace(' (optional)', '')} ${index + 1}`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label} item ${index + 1}`}
                    className="employer-icon-button employer-icon-button--danger"
                    onClick={() => onRemoveListField(field, index)}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ))}
            </div>
            <button className="employer-add-detail" type="button" onClick={() => onAddListField(field)}>
              <FaPlus /> Add item
            </button>
          </div>
        ))}
      </div>

      <div className="employer-form__section">
        <h3>Compensation</h3>

        <div className="employer-form__split employer-form__split--compact">
          <label className="employer-form__field">
            <span>Currency</span>
            <input
              id="currency"
              aria-invalid={Boolean(validationErrors.currency)}
              aria-describedby={validationErrors.currency ? 'currency-error' : undefined}
              value={form.currency}
              onChange={(event) => onFieldChange('currency', event.target.value.toUpperCase())}
              placeholder="NGN"
            />
            {validationErrors.currency ? (
              <span id="currency-error" className="employer-form__error" role="alert">
                {validationErrors.currency}
              </span>
            ) : null}
          </label>
        </div>

        {form.engagementType === 'MONTHLY' ? (
          <div className="employer-form__split">
            <label className="employer-form__field">
              <span>Minimum monthly salary</span>
              <input
                id="salaryMin"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(validationErrors.salaryMin)}
                aria-describedby={validationErrors.salaryMin ? 'salaryMin-error' : undefined}
                value={form.salaryMin}
                onChange={(event) => onFieldChange('salaryMin', event.target.value)}
              />
              {validationErrors.salaryMin ? (
                <span id="salaryMin-error" className="employer-form__error" role="alert">
                  {validationErrors.salaryMin}
                </span>
              ) : null}
            </label>

            <label className="employer-form__field">
              <span>Maximum monthly salary</span>
              <input
                id="salaryMax"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(validationErrors.salaryMax)}
                aria-describedby={validationErrors.salaryMax ? 'salaryMax-error' : undefined}
                value={form.salaryMax}
                onChange={(event) => onFieldChange('salaryMax', event.target.value)}
              />
              {validationErrors.salaryMax ? (
                <span id="salaryMax-error" className="employer-form__error" role="alert">
                  {validationErrors.salaryMax}
                </span>
              ) : null}
            </label>
          </div>
        ) : null}

        {form.engagementType === 'CONTRACT' ? (
          <div className="employer-form__split">
            <label className="employer-form__field">
              <span>Contract amount</span>
              <input
                id="contractAmount"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(validationErrors.contractAmount)}
                aria-describedby={validationErrors.contractAmount ? 'contractAmount-error' : undefined}
                value={form.contractAmount}
                onChange={(event) => onFieldChange('contractAmount', event.target.value)}
              />
              {validationErrors.contractAmount ? (
                <span id="contractAmount-error" className="employer-form__error" role="alert">
                  {validationErrors.contractAmount}
                </span>
              ) : null}
            </label>

            <label className="employer-form__field">
              <span>Contract duration</span>
              <input
                id="contractDuration"
                aria-invalid={Boolean(validationErrors.contractDuration)}
                aria-describedby={validationErrors.contractDuration ? 'contractDuration-error' : undefined}
                value={form.contractDuration}
                onChange={(event) => onFieldChange('contractDuration', event.target.value)}
                placeholder="e.g. 6 months"
              />
              {validationErrors.contractDuration ? (
                <span id="contractDuration-error" className="employer-form__error" role="alert">
                  {validationErrors.contractDuration}
                </span>
              ) : null}
            </label>

            <label className="employer-form__field">
              <span>Start option</span>
              <select
                value={form.contractStartMode}
                onChange={(event) => {
                  const mode = event.target.value as JobFormState['contractStartMode'];
                  onFieldChange('contractStartMode', mode);
                  if (mode === 'IMMEDIATE') onFieldChange('scheduledStartDate', '');
                }}
              >
                <option value="IMMEDIATE">Start immediately</option>
                <option value="SCHEDULED">Scheduled start date</option>
              </select>
            </label>

            {form.contractStartMode === 'SCHEDULED' ? (
              <label className="employer-form__field">
                <span>Scheduled start date</span>
                <input
                  id="scheduledStartDate"
                  type="date"
                  value={form.scheduledStartDate}
                  onChange={(event) => onFieldChange('scheduledStartDate', event.target.value)}
                  aria-invalid={Boolean(validationErrors.scheduledStartDate)}
                />
                {validationErrors.scheduledStartDate ? (
                  <span className="employer-form__error" role="alert">{validationErrors.scheduledStartDate}</span>
                ) : null}
              </label>
            ) : null}

            <label className="employer-form__field">
              <span>Expected completion date (optional)</span>
              <input
                id="expectedCompletionDate"
                type="date"
                value={form.expectedCompletionDate}
                onChange={(event) => onFieldChange('expectedCompletionDate', event.target.value)}
                aria-invalid={Boolean(validationErrors.expectedCompletionDate)}
              />
              {validationErrors.expectedCompletionDate ? (
                <span className="employer-form__error" role="alert">{validationErrors.expectedCompletionDate}</span>
              ) : null}
            </label>
          </div>
        ) : null}

        {form.engagementType === 'FREELANCE' ? (
          <label className="employer-form__field">
            <span>Project amount</span>
            <input
              id="freelanceAmount"
              type="number"
              min="0"
              step="0.01"
              aria-invalid={Boolean(validationErrors.freelanceAmount)}
              aria-describedby={validationErrors.freelanceAmount ? 'freelanceAmount-error' : undefined}
              value={form.freelanceAmount}
              onChange={(event) => onFieldChange('freelanceAmount', event.target.value)}
            />
            {validationErrors.freelanceAmount ? (
              <span id="freelanceAmount-error" className="employer-form__error" role="alert">
                {validationErrors.freelanceAmount}
              </span>
            ) : null}
          </label>
        ) : null}
      </div>

      <div className="employer-form__section">
        <h3>Application</h3>

        <label className="employer-form__field">
          <span>Application deadline</span>
          <input
            id="applicationDeadline"
            type="date"
            value={form.applicationDeadline}
            onChange={(event) => onFieldChange('applicationDeadline', event.target.value)}
          />
        </label>
      </div>

      <div className="employer-editor-actions">
        <button className="employer-button employer-button--ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="employer-button employer-button--primary" type="submit" disabled={isSaving}>
          <FaCheckCircle />
          {isSaving ? (isCreating ? 'Posting Job...' : 'Saving Changes...') : isCreating ? 'Post Job' : 'Update Job'}
        </button>
      </div>
    </form>
  );
}
