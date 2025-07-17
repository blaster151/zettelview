import { Note } from '../types/domain';
import { GraphLink, GraphRenderMode } from '../types/graph';

export class GraphLinkService {
  /**
   * Generate links based on the specified render mode
   */
  static generateLinks(notes: Note[], mode: GraphRenderMode): GraphLink[] {
    switch (mode) {
      case 'internal-links':
        return this.generateInternalLinks(notes);
      case 'tag-based':
        return this.generateTagBasedLinks(notes);
      case 'content-similarity':
        return this.generateContentSimilarityLinks(notes);
      case 'hybrid':
        return this.generateHybridLinks(notes);
      case 'hierarchical':
        return this.generateHierarchicalLinks(notes);
      default:
        return this.generateInternalLinks(notes);
    }
  }

  /**
   * Generate links based on [[Note Title]] references
   */
  private static generateInternalLinks(notes: Note[]): GraphLink[] {
    const links: GraphLink[] = [];
    const linkCounts: Record<string, number> = {};
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;
    
    notes.forEach(note => {
      let match;
      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        const linkTitle = match[1].trim();
        const targetNote = notes.find(n => 
          n.title.toLowerCase() === linkTitle.toLowerCase()
        );
        
        if (targetNote && targetNote.id !== note.id) {
          const linkKey = `${note.id}-${targetNote.id}`;
          const reverseKey = `${targetNote.id}-${note.id}`;
          
          if (!linkCounts[linkKey] && !linkCounts[reverseKey]) {
            links.push({
              source: note.id,
              target: targetNote.id,
              strength: 1,
              type: 'internal'
            });
            linkCounts[linkKey] = 1;
          } else {
            // Strengthen existing link
            const existingLink = links.find(l => 
              (l.source === note.id && l.target === targetNote.id) ||
              (l.source === targetNote.id && l.target === note.id)
            );
            if (existingLink) {
              existingLink.strength += 0.5;
            }
          }
        }
      }
    });

    return links;
  }

  /**
   * Generate links based on shared tags
   */
  private static generateTagBasedLinks(notes: Note[]): GraphLink[] {
    const links: GraphLink[] = [];
    const processedPairs = new Set<string>();

    notes.forEach((note1, index1) => {
      notes.slice(index1 + 1).forEach((note2, index2) => {
        const actualIndex2 = index1 + index2 + 1;
        const pairKey = `${note1.id}-${note2.id}`;
        const reverseKey = `${note2.id}-${note1.id}`;

        if (processedPairs.has(pairKey) || processedPairs.has(reverseKey)) {
          return;
        }

        // Find shared tags
        const sharedTags = note1.tags.filter(tag => note2.tags.includes(tag));
        
        if (sharedTags.length > 0) {
          links.push({
            source: note1.id,
            target: note2.id,
            strength: sharedTags.length * 0.5, // Strength based on number of shared tags
            type: 'tag'
          });
          processedPairs.add(pairKey);
        }
      });
    });

    return links;
  }

  /**
   * Generate links based on content similarity
   */
  private static generateContentSimilarityLinks(notes: Note[]): GraphLink[] {
    const links: GraphLink[] = [];
    const processedPairs = new Set<string>();

    // Extract keywords from each note
    const noteKeywords = notes.map(note => ({
      id: note.id,
      keywords: this.extractKeywords(note.title + ' ' + note.body)
    }));

    noteKeywords.forEach((note1, index1) => {
      noteKeywords.slice(index1 + 1).forEach((note2, index2) => {
        const actualIndex2 = index1 + index2 + 1;
        const pairKey = `${note1.id}-${note2.id}`;
        const reverseKey = `${note2.id}-${note1.id}`;

        if (processedPairs.has(pairKey) || processedPairs.has(reverseKey)) {
          return;
        }

        // Calculate similarity score
        const similarity = this.calculateSimilarity(note1.keywords, note2.keywords);
        
        if (similarity > 0.3) { // Threshold for similarity
          links.push({
            source: note1.id,
            target: note2.id,
            strength: similarity,
            type: 'similarity'
          });
          processedPairs.add(pairKey);
        }
      });
    });

    return links;
  }

  /**
   * Generate hybrid links combining internal links and tag connections
   */
  private static generateHybridLinks(notes: Note[]): GraphLink[] {
    const internalLinks = this.generateInternalLinks(notes);
    const tagLinks = this.generateTagBasedLinks(notes);
    
    // Combine links, strengthening duplicates
    const linkMap = new Map<string, GraphLink>();
    
    [...internalLinks, ...tagLinks].forEach(link => {
      const key = `${link.source}-${link.target}`;
      const reverseKey = `${link.target}-${link.source}`;
      
      if (linkMap.has(key) || linkMap.has(reverseKey)) {
        const existingKey = linkMap.has(key) ? key : reverseKey;
        const existing = linkMap.get(existingKey)!;
        existing.strength += link.strength * 0.5; // Boost strength for hybrid connections
      } else {
        linkMap.set(key, { ...link, type: 'internal' }); // Prefer internal link type for hybrid
      }
    });

    return Array.from(linkMap.values());
  }

  /**
   * Generate hierarchical links based on note title patterns
   */
  private static generateHierarchicalLinks(notes: Note[]): GraphLink[] {
    const links: GraphLink[] = [];
    
    notes.forEach(note => {
      // Look for potential parent notes based on title patterns
      const potentialParents = notes.filter(otherNote => {
        if (otherNote.id === note.id) return false;
        
        // Check if other note could be a parent based on title patterns
        const noteTitle = note.title.toLowerCase();
        const otherTitle = otherNote.title.toLowerCase();
        
        // Pattern 1: "Parent/Child" or "Parent - Child"
        if (noteTitle.includes('/') || noteTitle.includes(' - ')) {
          const parts = noteTitle.split(/[\/\-]/).map(p => p.trim());
          return parts.some(part => otherTitle.includes(part) && otherTitle.length < noteTitle.length);
        }
        
        // Pattern 2: "Parent: Child" or "Parent > Child"
        if (noteTitle.includes(':') || noteTitle.includes(' > ')) {
          const parts = noteTitle.split(/[:>]/).map(p => p.trim());
          return parts.some(part => otherTitle.includes(part) && otherTitle.length < noteTitle.length);
        }
        
        // Pattern 3: Numbered hierarchy "1. Parent" -> "1.1. Child"
        const noteMatch = noteTitle.match(/^(\d+\.?)/);
        const otherMatch = otherTitle.match(/^(\d+\.?)/);
        if (noteMatch && otherMatch) {
          const noteNum = noteMatch[1];
          const otherNum = otherMatch[1];
          return noteNum.startsWith(otherNum) && noteNum !== otherNum;
        }
        
        return false;
      });

      if (potentialParents.length > 0) {
        // Connect to the most likely parent (shortest title that matches)
        const bestParent = potentialParents.reduce((best, current) => 
          current.title.length < best.title.length ? current : best
        );
        
        links.push({
          source: bestParent.id,
          target: note.id,
          strength: 1,
          type: 'hierarchical'
        });
      }
    });

    return links;
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    // Remove markdown and special characters
    const cleanText = text
      .replace(/[#*`\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    
    // Split into words and filter out common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    return cleanText
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Calculate similarity between two keyword sets
   */
  private static calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }
} 