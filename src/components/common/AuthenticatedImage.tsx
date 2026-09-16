import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL, getProtectedBlob } from '../../services/api';

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
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    void getProtectedBlob(endpoint, token, 'Image could not be loaded.').then((result) => {
      if (!active || !result.ok) return;
      nextObjectUrl = URL.createObjectURL(result.data);
      setObjectUrl(nextObjectUrl);
    });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [endpoint, token]);

  if (!objectUrl || failed) return <>{fallback}</>;

  return <img className={className} src={toApiUrl(objectUrl)} alt={alt} onError={() => setFailed(true)} />;
}

export default AuthenticatedImage;