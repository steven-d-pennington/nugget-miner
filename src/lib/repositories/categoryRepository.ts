import { db } from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/lib/db/defaultCategories';
import { ValidationError } from '@/lib/errors';
import { normalizeLabel } from '@/lib/normalization/labels';
import type { Category } from '@/types';

export interface CreateCategoryInput {
  name: string;
  description: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  sortOrder?: number;
}

function validatedName(value: string) {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) throw new ValidationError('Category name is required.');
  return { name, normalizedName: normalizeLabel(name) };
}

function validatedDescription(value: string) {
  const description = value.trim();
  if (description.length < 20) {
    throw new ValidationError('Category description must be at least 20 characters.');
  }
  return description;
}

async function assertUniqueName(normalizedName: string, exceptId?: string) {
  const existing = await db.categories.where('normalizedName').equals(normalizedName).first();
  if (existing && existing.id !== exceptId) throw new ValidationError('Category name already exists.');
}

export const categoryRepository = {
  async ensureDefaults(): Promise<Category[]> {
    await db.transaction('rw', db.categories, async () => {
      const timestamp = Date.now();
      for (const category of DEFAULT_CATEGORIES) {
        if (!(await db.categories.get(category.id))) {
          await db.categories.add({ ...category, createdAt: timestamp, updatedAt: timestamp });
        }
      }
    });
    return this.list();
  },

  async list(): Promise<Category[]> {
    return db.categories.orderBy('sortOrder').toArray();
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const { name, normalizedName } = validatedName(input.name);
    const description = validatedDescription(input.description);
    await assertUniqueName(normalizedName);
    const categories = await this.list();
    const timestamp = Date.now();
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      normalizedName,
      description,
      isDefault: false,
      isFallback: false,
      sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 10,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.categories.add(category);
    return category;
  },

  async update(id: string, patch: UpdateCategoryInput): Promise<Category> {
    const existing = await db.categories.get(id);
    if (!existing) throw new ValidationError('Category not found.');

    const nextName = patch.name === undefined ? { name: existing.name, normalizedName: existing.normalizedName } : validatedName(patch.name);
    const description = patch.description === undefined ? existing.description : validatedDescription(patch.description);
    await assertUniqueName(nextName.normalizedName, id);

    const updated: Category = {
      ...existing,
      ...nextName,
      description,
      sortOrder: patch.sortOrder ?? existing.sortOrder,
      updatedAt: Date.now(),
    };
    await db.categories.put(updated);
    return updated;
  },

  async removeAndReassign(id: string, replacementId: string): Promise<void> {
    await db.transaction('rw', db.categories, db.ideas, async () => {
      const [category, replacement] = await Promise.all([db.categories.get(id), db.categories.get(replacementId)]);
      if (!category) throw new ValidationError('Category not found.');
      if (category.isFallback) throw new ValidationError('The fallback category cannot be deleted.');
      if (!replacement || replacement.id === category.id) throw new ValidationError('A different replacement category is required.');

      await db.ideas.where('categoryId').equals(id).modify({ categoryId: replacement.id, updatedAt: Date.now() });
      await db.categories.delete(id);
    });
  },
};
