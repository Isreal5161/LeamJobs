import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { initialJobs, type ModerationStatus, type PublicJob } from '../data/jobData';

type JobStoreContextValue = {
  jobs: PublicJob[];
  visibleJobs: PublicJob[];
  addJob: (job: PublicJob) => void;
  updateJob: (jobId: string, patch: Partial<PublicJob>) => void;
  updateJobStatus: (jobId: string, status: ModerationStatus) => void;
};

const JobStoreContext = createContext<JobStoreContextValue | undefined>(undefined);

export function JobStoreProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState(initialJobs);

  const value = useMemo<JobStoreContextValue>(() => {
    const addJob = (job: PublicJob) => {
      setJobs((current) => [job, ...current]);
    };

    const updateJob = (jobId: string, patch: Partial<PublicJob>) => {
      setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, ...patch } : job)));
    };

    const updateJobStatus = (jobId: string, status: ModerationStatus) => {
      updateJob(jobId, { status });
    };

    return {
      jobs,
      visibleJobs: jobs.filter((job) => job.status === 'Approved'),
      addJob,
      updateJob,
      updateJobStatus,
    };
  }, [jobs]);

  return <JobStoreContext.Provider value={value}>{children}</JobStoreContext.Provider>;
}

export function useJobStore() {
  const context = useContext(JobStoreContext);

  if (!context) {
    throw new Error('useJobStore must be used inside JobStoreProvider');
  }

  return context;
}
