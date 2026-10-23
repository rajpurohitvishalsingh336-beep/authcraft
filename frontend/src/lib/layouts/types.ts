export type LayoutCategory =
  | 'minimal'
  | 'luxury'
  | 'saas'
  | 'corporate'
  | 'glassmorphism'
  | 'dark'
  | 'gradient'
  | 'split'
  | 'startup'
  | 'ecommerce'
  | 'creative'
  | 'education'
  | 'editorial'
  | 'compact';

export type LayoutFamily =
  | 'centered-card'
  | 'centered-minimal'
  | 'split-left'
  | 'split-right'
  | 'luxury-crest'
  | 'glassmorphism'
  | 'terminal'
  | 'editorial'
  | 'compact-dock'
  | 'banner-stacked'
  | 'corporate-portal';

export interface LayoutTokens {
  container: string;
  card: string;
  headerPosition: 'inside' | 'banner' | 'side' | 'hero';
  accentColor: string;
  primaryBtn: string;
  inputStyle: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  theme: 'light' | 'dark' | 'luxury';
  borderRadius: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroQuote?: string;
  heroAuthor?: string;
  heroAuthorRole?: string;
  badge?: {
    text: string;
    variant: 'gold' | 'silver' | 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';
  };
  decorations?: 'grid' | 'dots' | 'mesh' | 'gold-border' | 'terminal-bar' | 'none';
  socialPlacement?: 'top' | 'bottom' | 'hidden';
}

export interface LayoutDefinition {
  id: string;
  name: string;
  category: LayoutCategory;
  categoryLabel: string;
  description: string;
  family: LayoutFamily;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  tokens: LayoutTokens;
}

export interface CategoryMeta {
  id: LayoutCategory;
  label: string;
  count: number;
  description: string;
}
