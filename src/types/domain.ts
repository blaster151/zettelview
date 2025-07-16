// Domain types for ZettelView

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkReference {
  noteId: string;
  noteTitle: string;
  context: string;
}

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  size: number;
  color: string;
  tags: string[];
  isHovered?: boolean;
  isSelected?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

// Example: shared props for panels/components
export interface NoteIdProps {
  noteId: string;
} 