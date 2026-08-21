import { FaAirbnb, FaAmazon, FaFigma, FaGoogle, FaMicrosoft, FaSlack, FaSpotify } from 'react-icons/fa';
import { SiDropbox, SiNotion, SiStripe } from 'react-icons/si';

type CompanyLogoProps = {
  company: string;
  logoText: string;
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

function CompanyLogo({ company, logoText, logoClass = '' }: CompanyLogoProps) {
  const icon = COMPANY_ICONS[company.toLowerCase()];

  return (
    <div className={`company-logo ${logoClass}`} title={company}>
      {icon ?? <span className="company-logo__symbol">{logoText}</span>}
    </div>
  );
}

export default CompanyLogo;
