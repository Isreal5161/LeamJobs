type ApplicationCoverLetterProps = {
  coverLetter: string | null | undefined;
};

function ApplicationCoverLetter({ coverLetter }: ApplicationCoverLetterProps) {
  return (
    <section className="employer-candidate-section applicant-cover-letter">
      <div className="employer-detail-section-header"><h2>Cover letter</h2></div>
      <p className="applicant-cover-letter__content">
        {coverLetter?.trim() ? coverLetter : 'No cover letter submitted.'}
      </p>
    </section>
  );
}

export default ApplicationCoverLetter;
