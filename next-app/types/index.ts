export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  pillarKeyword?: string;
  shortDescription: string;
  longDescription?: string;
  category: string;
  categoryLabel: string;
  iconName: string;
  execution?: 'local' | 'ai' | 'workflow';
  status?: 'published' | 'draft' | 'roadmap' | 'retired';
  indexable: boolean;
  engineVerified?: boolean;
  tags: string[];
  seoKeywords?: string[];
  searchVolume?: number;
  exampleInput?: string;
  explanation: string;
  howToUse: string[];
  privacyNotice: string;
  faqs: { question: string; answer: string }[];
  relatedToolIds: string[];
  pillarSlug?: string;
  clusterSlug?: string;
}

export interface PillarDefinition {
  slug: string;
  num: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  toolCount?: number;
  keywords?: string[];
}

export interface ClusterDefinition {
  slug: string;
  pillarSlug: string;
  num: number;
  name: string;
  description: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  slug: string;
  description: string;
  icon: string;
  toolCount?: number;
}

export type ExecutionMode = 'local' | 'ai' | 'workflow';

export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime?: number;
}
