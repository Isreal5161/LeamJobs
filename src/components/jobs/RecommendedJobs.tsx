import { useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import JobCard, { RecommendedJob } from './JobCard';
import { useJobStore } from '../../context/JobStoreContext';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'salaryHigh', label: 'Salary: High to Low' },
  { value: 'salaryLow', label: 'Salary: Low to High' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

function sortJobs(jobs: RecommendedJob[], sortKey: SortOption) {
  const sorted = [...jobs];

  switch (sortKey) {
    case 'newest':
      return sorted.sort((a, b) => b.postedAt - a.postedAt);
    case 'salaryHigh':
      return sorted.sort((a, b) => b.salaryHigh - a.salaryHigh);
    case 'salaryLow':
      return sorted.sort((a, b) => a.salaryHigh - b.salaryHigh);
    default:
      return sorted;
  }
}

function RecommendedJobs({ jobs }: { jobs?: RecommendedJob[] }) {
  const { visibleJobs } = useJobStore();
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const jobsToDisplay = jobs ?? visibleJobs;
  const sortedJobs = useMemo(() => sortJobs(jobsToDisplay, sortOption), [jobsToDisplay, sortOption]);

  const handleBookmarkToggle = (jobId: string) => {
    setSavedIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId],
    );
  };

  const handleApply = (company: string, role: string) => {
    console.log(`Apply clicked for ${role} at ${company}`);
  };

  const handleViewDetails = (company: string, role: string) => {
    console.log(`View details clicked for ${role} at ${company}`);
  };

  return (
    <section className="recommended-jobs-panel">
      <div className="recommended-jobs__header">
        <h2>Recommended jobs</h2>

        <div className="recommended-jobs__sort">
          <span>Sort by:</span>
          <div className="sort-select">
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              aria-label="Sort recommended jobs"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FaChevronDown aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="recommended-jobs__list">
        {sortedJobs.map((job) => (
          <JobCard
            key={job.id}
            {...job}
            saved={savedIds.includes(job.id)}
            onToggleBookmark={() => handleBookmarkToggle(job.id)}
            onApply={() => handleApply(job.company, job.role)}
            onViewDetails={() => handleViewDetails(job.company, job.role)}
          />
        ))}
        {sortedJobs.length === 0 ? <p className="recommended-jobs__empty">No jobs match your search or filter.</p> : null}
      </div>
    </section>
  );
}

export default RecommendedJobs;
