import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL, getProtectedBlob } from '../../services/api';
import { getUserScopedImageUrl, type UserScopedImage } from '../../utils/profileImageState';

type AuthenticatedImageProps = {
  endpoint: string;
  token: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
};

const toApiUrl = (endpoint: string) => {
  if (/^https?:\/\//i.test(endpoint) || endpoint.startsWith('blob:')) return endpoint;
  if (endpoint.startsWith('/api/')) return `${API_BASE_URL}${endpoint.slice(4)}`;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

function AuthenticatedImage({ endpoint, token, alt, className, fallback }: AuthenticatedImageProps) {
  const [image, setImage] = useState<UserScopedImage | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const requestOwner = `${token}\u0000${endpoint}`;

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;
    setImage(null);
    setFailedFor(null);

    void getProtectedBlob(endpoint, token, 'Image could not be loaded.').then((result) => {
      if (!active || !result.ok) return;
      nextObjectUrl = URL.createObjectURL(result.data);
      setImage({ ownerId: requestOwner, url: nextObjectUrl });
    });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [endpoint, requestOwner, token]);

  const objectUrl = getUserScopedImageUrl(image, requestOwner);
  if (!objectUrl || failedFor === requestOwner) return <>{fallback}</>;

  return <img className={className} src={toApiUrl(objectUrl)} alt={alt} onError={() => setFailedFor(requestOwner)} />;
}

export default AuthenticatedImage;