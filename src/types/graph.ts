export type GraphRenderMode = 
  | 'internal-links'     // [[Note Title]] references (current)
  | 'tag-based'          // Connect notes that share tags
  | 'content-similarity' // Connect notes with similar content
  | 'hybrid'             // Internal links + tag connections
  | 'hierarchical';      // Parent-child relationships

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: 'internal' | 'tag' | 'similarity' | 'hierarchical';
}

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  size: number;
  color: string;
  tags: string[];
  isSelected: boolean;
  isHovered: boolean;
}

export interface GraphRenderModeConfig {
  id: GraphRenderMode;
  name: string;
  description: string;
  icon: string;
}

export const GRAPH_RENDER_MODES: GraphRenderModeConfig[] = [
  {
    id: 'internal-links',
    name: 'Internal Links',
    description: 'Show explicit connections via [[Note Title]] references',
    icon: '🔗'
  },
  {
    id: 'tag-based',
    name: 'Tag Clusters',
    description: 'Connect notes that share tags to show thematic relationships',
    icon: '🏷️'
  },
  {
    id: 'content-similarity',
    name: 'Content Similarity',
    description: 'Connect notes with similar content and keywords',
    icon: '📝'
  },
  {
    id: 'hybrid',
    name: 'Hybrid View',
    description: 'Combine internal links and tag connections for complete picture',
    icon: '🔀'
  },
  {
    id: 'hierarchical',
    name: 'Hierarchical',
    description: 'Show parent-child relationships based on note titles',
    icon: '📊'
  }
]; 