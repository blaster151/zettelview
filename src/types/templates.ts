export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'project' | 'meeting' | 'research' | 'personal' | 'custom';
  content: string;
  tags: string[];
  metadata: {
    created: Date;
    lastUsed: Date;
    usageCount: number;
    isDefault: boolean;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: NoteTemplate[];
}

export interface CreateNoteFromTemplateOptions {
  templateId: string;
  title: string;
  customTags?: string[];
  customContent?: string;
} 