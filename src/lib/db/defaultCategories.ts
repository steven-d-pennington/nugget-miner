import type { Category } from '@/types';

const timestamp = 0;

export const DEFAULT_CATEGORY_IDS = {
  work: 'category-work',
  school: 'category-school',
  personal: 'category-personal',
  family: 'category-family',
  misc: 'category-misc',
} as const;

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: DEFAULT_CATEGORY_IDS.work,
    name: 'Work',
    normalizedName: 'work',
    description:
      'Professional responsibilities, paid work, clients, coworkers, business operations, career development, and job-related projects. Examples: improve an internal deployment process; prepare a client proposal; follow up with a coworker. Do not use for coursework or purely personal side projects.',
    isDefault: true,
    isFallback: false,
    sortOrder: 10,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.school,
    name: 'School',
    normalizedName: 'school',
    description:
      'Formal learning, classes, assignments, studying, academic research, instructors, and school organizations. Examples: outline a term paper; compare degree programs; prepare for an exam. Do not use for work training unless it is part of a formal course.',
    isDefault: true,
    isFallback: false,
    sortOrder: 20,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.personal,
    name: 'Personal',
    normalizedName: 'personal',
    description:
      'Individual projects, hobbies, health, finances, home, creativity, self-improvement, and personal errands that are not primarily about work, school, or family coordination. Examples: build a neighborhood tool library; train for a race; redesign a home office.',
    isDefault: true,
    isFallback: false,
    sortOrder: 30,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.family,
    name: 'Family',
    normalizedName: 'family',
    description:
      'Shared household or family responsibilities, relationships, caregiving, events, and plans involving relatives. Examples: organize a family reunion; create a chore schedule; research care options for a parent. Use Personal when the idea concerns only the speaker.',
    isDefault: true,
    isFallback: false,
    sortOrder: 40,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.misc,
    name: 'Misc',
    normalizedName: 'misc',
    description:
      'Fallback for ideas that do not fit another category or are too ambiguous to classify confidently. Use only after comparing the idea against every other category description.',
    isDefault: true,
    isFallback: true,
    sortOrder: 50,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];
