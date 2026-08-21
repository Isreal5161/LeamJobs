import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

type BookmarkButtonProps = {
  saved: boolean;
  onToggle: () => void;
  ariaLabel: string;
  className?: string;
};

function BookmarkButton({ saved, onToggle, ariaLabel, className = '' }: BookmarkButtonProps) {
  return (
    <button
      type="button"
      className={`bookmark-button${saved ? ' bookmark-button--saved' : ''}${className ? ` ${className}` : ''}`}
      onClick={onToggle}
      aria-label={ariaLabel}
    >
      {saved ? <FaBookmark /> : <FaRegBookmark />}
    </button>
  );
}

export default BookmarkButton;
