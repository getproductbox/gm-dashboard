export type Category = 'wages' | 'cogs' | 'security' | 'rent' | 'utilities' | 'other';

export type MappingRule = {
  match: { code?: string; nameContains?: string };
  category: Category;
};

// Seed with a few examples; extend via DB or config later
export const defaultMappingRules: MappingRule[] = [
  { match: { nameContains: 'wage' }, category: 'wages' },
  { match: { nameContains: 'payroll' }, category: 'wages' },
  { match: { nameContains: 'cogs' }, category: 'cogs' },
  { match: { nameContains: 'cost of sales' }, category: 'cogs' },
  { match: { nameContains: 'security' }, category: 'security' },
  { match: { nameContains: 'guard' }, category: 'security' },
];

export function mapAccountToCategory(account: { Code?: string; Name?: string }): Category {
  const code = (account.Code || '').toLowerCase();
  const name = (account.Name || '').toLowerCase();
  for (const rule of defaultMappingRules) {
    if (rule.match.code && code === rule.match.code.toLowerCase()) return rule.category;
    if (rule.match.nameContains && name.includes(rule.match.nameContains.toLowerCase())) return rule.category;
  }
  return 'other';
}


