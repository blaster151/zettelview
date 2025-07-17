import { GraphLinkService } from './graphLinkService';
import { Note } from '../types/domain';
import { GraphRenderMode } from '../types/graph';

// Mock notes for testing
const mockNotes: Note[] = [
  {
    id: 'note1',
    title: 'Programming Guide',
    body: 'This is a guide about [[JavaScript]] and [[React]]. Also mentions [[TypeScript]].',
    tags: ['programming', 'javascript', 'frontend'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'note2',
    title: 'JavaScript Basics',
    body: 'Learn the basics of JavaScript. Related to [[Programming Guide]].',
    tags: ['programming', 'javascript', 'basics'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'note3',
    title: 'React Tutorial',
    body: 'A tutorial about React framework. Builds on [[JavaScript Basics]].',
    tags: ['programming', 'react', 'frontend'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'note4',
    title: 'Project Management',
    body: 'Guide to managing software projects effectively.',
    tags: ['management', 'planning'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'note5',
    title: 'Project Management/Agile',
    body: 'Agile methodology for project management.',
    tags: ['management', 'agile'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('GraphLinkService', () => {
  describe('generateLinks', () => {
    it('should generate internal links correctly', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'internal-links');
      
      expect(links).toHaveLength(2); // note2 -> note1, note3 -> note2
      expect(links.every(link => link.type === 'internal')).toBe(true);
      
      // Check specific links
      const note2ToNote1 = links.find(l => l.source === 'note2' && l.target === 'note1');
      const note3ToNote2 = links.find(l => l.source === 'note3' && l.target === 'note2');
      
      expect(note2ToNote1).toBeDefined();
      expect(note3ToNote2).toBeDefined();
    });

    it('should generate tag-based links correctly', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'tag-based');
      
      expect(links.length).toBeGreaterThan(0);
      expect(links.every(link => link.type === 'tag')).toBe(true);
      
      // Check that notes with shared tags are connected
      const programmingLinks = links.filter(l => 
        (l.source === 'note1' && l.target === 'note2') ||
        (l.source === 'note1' && l.target === 'note3') ||
        (l.source === 'note2' && l.target === 'note3')
      );
      
      expect(programmingLinks.length).toBeGreaterThan(0);
    });

    it('should generate content similarity links correctly', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'content-similarity');
      
      // Content similarity should find connections between programming-related notes
      expect(links.every(link => link.type === 'similarity')).toBe(true);
      
      // Similarity scores should be between 0 and 1
      expect(links.every(link => link.strength >= 0 && link.strength <= 1)).toBe(true);
    });

    it('should generate hybrid links correctly', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'hybrid');
      
      expect(links.length).toBeGreaterThan(0);
      
      // Hybrid should combine internal and tag links
      const hasInternalLinks = links.some(link => link.type === 'internal');
      expect(hasInternalLinks).toBe(true);
      
      // Should have stronger connections for hybrid links
      const avgStrength = links.reduce((sum, link) => sum + link.strength, 0) / links.length;
      expect(avgStrength).toBeGreaterThan(0.5);
    });

    it('should generate hierarchical links correctly', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'hierarchical');
      
      // Should find parent-child relationship between Project Management and Project Management/Agile
      const hierarchicalLinks = links.filter(link => link.type === 'hierarchical');
      expect(hierarchicalLinks.length).toBeGreaterThan(0);
      
      // Check for specific hierarchical relationship
      const pmToAgile = links.find(l => 
        l.source === 'note4' && l.target === 'note5' && l.type === 'hierarchical'
      );
      expect(pmToAgile).toBeDefined();
    });

    it('should handle empty notes array', () => {
      const links = GraphLinkService.generateLinks([], 'internal-links');
      expect(links).toEqual([]);
    });

    it('should handle single note', () => {
      const singleNote = [mockNotes[0]];
      const links = GraphLinkService.generateLinks(singleNote, 'internal-links');
      expect(links).toEqual([]);
    });

    it('should default to internal-links for unknown mode', () => {
      const links = GraphLinkService.generateLinks(mockNotes, 'unknown-mode' as GraphRenderMode);
      expect(links.every(link => link.type === 'internal')).toBe(true);
    });
  });

  describe('link strength calculations', () => {
    it('should calculate appropriate strengths for different link types', () => {
      const internalLinks = GraphLinkService.generateLinks(mockNotes, 'internal-links');
      const tagLinks = GraphLinkService.generateLinks(mockNotes, 'tag-based');
      
      // Internal links should have base strength of 1
      expect(internalLinks.every(link => link.strength >= 1)).toBe(true);
      
      // Tag links should have strength based on number of shared tags
      expect(tagLinks.every(link => link.strength > 0)).toBe(true);
    });

    it('should strengthen duplicate links', () => {
      const notesWithDuplicates: Note[] = [
        {
          id: 'note1',
          title: 'Note 1',
          body: 'References [[Note 2]] and [[Note 2]] again.',
          tags: ['tag1'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'note2',
          title: 'Note 2',
          body: 'Some content.',
          tags: ['tag1'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const links = GraphLinkService.generateLinks(notesWithDuplicates, 'internal-links');
      const note1ToNote2 = links.find(l => l.source === 'note1' && l.target === 'note2');
      
      expect(note1ToNote2).toBeDefined();
      expect(note1ToNote2!.strength).toBeGreaterThan(1); // Should be strengthened due to duplicate reference
    });
  });

  describe('edge cases', () => {
    it('should handle notes with no tags', () => {
      const notesWithoutTags = mockNotes.map(note => ({ ...note, tags: [] }));
      const links = GraphLinkService.generateLinks(notesWithoutTags, 'tag-based');
      expect(links).toEqual([]);
    });

    it('should handle notes with no content', () => {
      const notesWithoutContent = mockNotes.map(note => ({ ...note, body: '' }));
      const links = GraphLinkService.generateLinks(notesWithoutContent, 'internal-links');
      expect(links).toEqual([]);
    });

    it('should handle malformed internal links', () => {
      const notesWithMalformedLinks: Note[] = [
        {
          id: 'note1',
          title: 'Note 1',
          body: '[[Incomplete link and [[Complete Link]] and [[',
          tags: ['tag1'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'note2',
          title: 'Complete Link',
          body: 'Some content.',
          tags: ['tag1'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const links = GraphLinkService.generateLinks(notesWithMalformedLinks, 'internal-links');
      // Should only create link for the complete reference
      expect(links.length).toBe(1);
      expect(links[0].source).toBe('note1');
      expect(links[0].target).toBe('note2');
    });
  });
}); 