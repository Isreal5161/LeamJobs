import { useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import JobCard, { RecommendedJob } from './JobCard';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'salaryHigh', label: 'Salary: High to Low' },
  { value: 'salaryLow', label: 'Salary: Low to High' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

const JOBS: RecommendedJob[] = [
  {
    id: 'google',
    company: 'Google',
    logoText: 'G',
    logoClass: 'brand-logo--google',
    featured: true,
    role: 'Senior Product Designer',
    salary: '$150k - $190k',
    location: 'New York, NY',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Design delightful products used by billions worldwide.',
    postedAt: 6,
    salaryHigh: 190,
  },
  {
    id: 'amazon',
    company: 'Amazon',
    logoText: 'a',
    logoClass: 'brand-logo--amazon',
    role: 'Senior UI/UX Designer',
    salary: '$130k - $160k',
    location: 'Seattle, WA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Craft user experiences that make a global impact.',
    postedAt: 5,
    salaryHigh: 160,
  },
  {
    id: 'figma',
    company: 'Figma',
    logoText: 'F',
    logoClass: 'brand-logo--figma',
    role: 'Product Designer',
    salary: '$120k - $150k',
    location: 'San Francisco, CA',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Empower teams to build better products together.',
    postedAt: 4,
    salaryHigh: 150,
  },
  {
    id: 'spotify',
    company: 'Spotify',
    logoText: 'S',
    logoClass: 'brand-logo--spotify',
    role: 'Senior Product Designer',
    salary: '$140k - $180k',
    location: 'Stockholm, Sweden',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Create intuitive experiences for millions of listeners.',
    postedAt: 3,
    salaryHigh: 180,
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    logoText: 'M',
    logoClass: 'brand-logo--microsoft',
    role: 'UX Designer',
    salary: '$125k - $155k',
    location: 'Redmond, WA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Design accessible experiences for users around the world.',
    postedAt: 2,
    salaryHigh: 155,
  },
  {
    id: 'airbnb',
    company: 'Airbnb',
    logoText: 'A',
    logoClass: 'brand-logo--airbnb',
    role: 'Product Designer',
    salary: '$135k - $175k',
    location: 'San Francisco, CA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Create meaningful experiences for travelers and hosts.',
    postedAt: 1,
    salaryHigh: 175,
  },
];

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

function RecommendedJobs() {
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const sortedJobs = useMemo(() => sortJobs(JOBS, sortOption), [sortOption]);

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
      </div>
    </section>
  );
}

export default RecommendedJobs;
