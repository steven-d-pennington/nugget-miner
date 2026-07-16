import {
  actionItemRepository,
  categoryRepository,
  ideaRepository,
  tagRepository,
} from '@/lib/repositories';
import type { Category, Idea, Tag } from '@/types';

export interface IdeaLibraryRow {
  idea: Idea;
  category: Category;
  tags: Tag[];
  openActionCount: number;
  hasBlockers: boolean;
  needsResearch: boolean;
}

export interface SearchIdeasInput {
  query?: string;
  categoryId?: string;
  tagIds?: string[];
  includeArchived?: boolean;
}

function normalizeSearch(value: string) {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesQuery(row: IdeaLibraryRow, query: string) {
  const haystack = normalizeSearch(
    [row.idea.title, row.idea.summary.text, ...row.tags.map((tag) => tag.name)].join(' '),
  );
  return query.split(' ').every((term) => haystack.includes(term));
}

export const LibraryService = {
  async search(input: SearchIdeasInput = {}): Promise<IdeaLibraryRow[]> {
    const [ideas, categories, tags, openActions] = await Promise.all([
      ideaRepository.listConfirmed(input.includeArchived),
      categoryRepository.list(),
      tagRepository.list(),
      actionItemRepository.listByStatus('open'),
    ]);
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    const openActionCountByIdea = new Map<string, number>();
    for (const action of openActions) {
      openActionCountByIdea.set(action.ideaId, (openActionCountByIdea.get(action.ideaId) ?? 0) + 1);
    }

    const rows = ideas.flatMap((idea): IdeaLibraryRow[] => {
      const category = categoriesById.get(idea.categoryId);
      if (!category) return [];
      return [
        {
          idea,
          category,
          tags: idea.tagIds.flatMap((tagId) => {
            const tag = tagsById.get(tagId);
            return tag ? [tag] : [];
          }),
          openActionCount: openActionCountByIdea.get(idea.id) ?? 0,
          hasBlockers: idea.blockers.length > 0,
          needsResearch: idea.research.needed,
        },
      ];
    });
    const query = normalizeSearch(input.query ?? '');
    const selectedTagIds = input.tagIds ?? [];

    return rows
      .filter((row) => !input.categoryId || row.idea.categoryId === input.categoryId)
      .filter((row) => selectedTagIds.every((tagId) => row.idea.tagIds.includes(tagId)))
      .filter((row) => !query || matchesQuery(row, query))
      .sort((left, right) => right.idea.updatedAt - left.idea.updatedAt);
  },
};
