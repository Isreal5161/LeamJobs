import { FaAirbnb, FaAmazon, FaFigma, FaGoogle, FaMicrosoft, FaSpotify } from 'react-icons/fa';

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
