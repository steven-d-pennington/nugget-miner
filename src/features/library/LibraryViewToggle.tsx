import type { IdeaLibraryView } from './libraryViewPreference';

export function LibraryViewToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: IdeaLibraryView;
  onChange(view: IdeaLibraryView): void;
  disabled?: boolean;
}) {
  return (
    <div aria-label="Idea display" className="library-view-toggle" role="group">
      <button aria-pressed={value === 'cards'} disabled={disabled} onClick={() => onChange('cards')} type="button">
        Cards
      </button>
      <button aria-pressed={value === 'compact'} disabled={disabled} onClick={() => onChange('compact')} type="button">
        Compact
      </button>
    </div>
  );
}
