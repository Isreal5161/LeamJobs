import { useEffect, useState } from 'react';
import { FaAirbnb, FaAmazon, FaFigma, FaGoogle, FaMicrosoft, FaSlack, FaSpotify } from 'react-icons/fa';
import { SiDropbox, SiNotion, SiStripe } from 'react-icons/si';
import { API_BASE_URL } from '../../services/api';

type CompanyLogoProps = {
  company: string;
  logoText: string;
  logoUrl?: string | null;
  logoClass?: string;
};

const COMPANY_ICONS: Record<string, JSX.Element> = {
  google: <FaGoogle />,
  amazon: <FaAmazon />,
  figma: <FaFigma />,
  spotify: <FaSpotify />,
  microsoft: <FaMicrosoft />,
  airbnb: <FaAirbnb />,
  slack: <FaSlack />,
  dropbox: <SiDropbox />,
  stripe: <SiStripe />,
  notion: <SiNotion />,
};

function CompanyLogo({ company, logoText, logoUrl, logoClass = '' }: CompanyLogoProps) {
  const icon = COMPANY_ICONS[company.toLowerCase()];
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = logoUrl?.startsWith('/api/') ? `${API_BASE_URL}${logoUrl.slice(4)}` : logoUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  return (
    <div className={`company-logo ${logoClass}`} title={company}>
      {imageSource && !imageFailed ? <img src={imageSource} alt={`${company} logo`} onError={() => setImageFailed(true)} /> : icon ?? <span className="company-logo__symbol">{logoText}</span>}
    </div>
  );
}

export default CompanyLogo;
