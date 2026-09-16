import { useEffect, useState } from 'react';
import AuthenticatedImage from '../common/AuthenticatedImage';

type ApplicantAvatarProps = {
  name: string;
  imageUrl?: string;
  imageEndpoint?: string;
  token?: string | null;
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

function ApplicantAvatar({ name, imageUrl, imageEndpoint, token, size = 'md' }: ApplicantAvatarProps) {
  const className = `employer-applicant-avatar employer-applicant-avatar--${size}`;
  const fallback = <span className={className} role="img" aria-label={`${name} profile placeholder`}>{getInitials(name)}</span>;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (imageEndpoint && token) {
    return <AuthenticatedImage endpoint={imageEndpoint} token={token} alt={`${name} profile`} className={className} fallback={fallback} />;
  }

  if (imageUrl && !imageFailed) {
    return <span className={className}><img src={imageUrl} alt={`${name} profile`} onError={() => setImageFailed(true)} /></span>;
  }

  return fallback;
}

export default ApplicantAvatar;
