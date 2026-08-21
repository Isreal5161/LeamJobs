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
  return (
    <span className={`employer-applicant-avatar employer-applicant-avatar--${size}`} aria-label={name}>
      {imageUrl ? <img src={imageUrl} alt="" /> : getInitials(name)}
    </span>
  );
}

export default ApplicantAvatar;
