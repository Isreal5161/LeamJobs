type ApplicantAvatarProps = {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function ApplicantAvatar({ name, imageUrl, size = 'md' }: ApplicantAvatarProps) {
  const className = `employer-applicant-avatar employer-applicant-avatar--${size}`;

  if (imageUrl) {
    return <span className={className}><img src={imageUrl} alt={`${name} profile`} /></span>;
  }

  return (
    <span className={className} role="img" aria-label={`${name} profile placeholder`}>
      {getInitials(name)}
    </span>
  );
}

export default ApplicantAvatar;
