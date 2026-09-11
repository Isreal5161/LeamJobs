import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';

type AccountMenuItem = {
  label: string;
  to: string;
};

type AccountMenuProps = {
  items: AccountMenuItem[];
  userName?: string;
  roleLabel?: string;
  imageUrl?: string | null;
  isImageLoading?: boolean;
  onLogout?: () => void;
};

function AccountMenu({ items, userName, roleLabel, imageUrl, isImageLoading = false, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={`account-menu__avatar${isImageLoading ? ' account-menu__avatar--loading' : ''}`}>
          {imageUrl && !imageFailed ? <img src={imageUrl} alt={`${userName || 'Account'} profile`} onError={() => setImageFailed(true)} /> : <span aria-hidden="true">{initial}</span>}
        </span>
        {userName ? <span className="account-menu__identity"><span className="account-menu__name">{userName}</span>{roleLabel ? <small>{roleLabel}</small> : null}</span> : null}
        <FaChevronDown className="account-menu__chevron" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="account-menu__panel" role="menu">
          {items.map((item) => (
            <Link key={item.to} to={item.to} className="account-menu__item" role="menuitem" onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className="account-menu__item account-menu__item--logout"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout?.();
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AccountMenu;
