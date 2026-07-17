export type IdeaLibraryView = 'cards' | 'compact';

export const IDEA_LIBRARY_VIEW_KEY = 'nugget:ideas:view';

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

export function readLibraryView(
  storage: StorageReader | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
): IdeaLibraryView {
  try {
    return storage?.getItem(IDEA_LIBRARY_VIEW_KEY) === 'compact' ? 'compact' : 'cards';
  } catch {
    return 'cards';
  }
}

export function writeLibraryView(
  view: IdeaLibraryView,
  storage: StorageWriter | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
) {
  try {
    storage?.setItem(IDEA_LIBRARY_VIEW_KEY, view);
  } catch {
    // Presentation preference failure must never make the local idea library unavailable.
  }
}
