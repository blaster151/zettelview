import { Note } from '../types/domain';
import { AppliedFilters } from '../components/features/AdvancedFilters';

export function applyAdvancedFilters(notes: Note[], filters: AppliedFilters): Note[] {
  let filtered = [...notes];

  // Date range filter
  if (filters.datePreset !== 'all' || (filters.dateRange.start || filters.dateRange.end)) {
    filtered = filtered.filter(note => {
      const created = new Date(note.createdAt);
      if (filters.dateRange.start && created < filters.dateRange.start) return false;
      if (filters.dateRange.end && created > filters.dateRange.end) return false;
      return true;
    });
  }

  // Content type filters
  if (filters.contentTypes.hasLinks) {
    filtered = filtered.filter(note => /\[\[([^[\]]+)\]\]/g.test(note.body));
  }
  if (filters.contentTypes.hasTags) {
    filtered = filtered.filter(note => note.tags && note.tags.length > 0);
  }
  if (filters.contentTypes.hasContent) {
    filtered = filtered.filter(note => note.body && note.body.length > 100);
  }
  if (filters.contentTypes.hasAttachments) {
    filtered = filtered.filter(note => Array.isArray(note.attachments) && note.attachments.length > 0);
  }
  if (filters.contentTypes.isArchived) {
    filtered = filtered.filter(note => note.archived === true);
  }

  // Tag filters
  if (filters.includeTags.length > 0) {
    if (filters.tagLogic === 'all') {
      filtered = filtered.filter(note => filters.includeTags.every(tag => note.tags.includes(tag)));
    } else if (filters.tagLogic === 'any') {
      filtered = filtered.filter(note => note.tags.some(tag => filters.includeTags.includes(tag)));
    } else if (filters.tagLogic === 'none') {
      filtered = filtered.filter(note => note.tags.every(tag => !filters.includeTags.includes(tag)));
    }
  }
  if (filters.excludeTags.length > 0) {
    filtered = filtered.filter(note => note.tags.every(tag => !filters.excludeTags.includes(tag)));
  }

  // Text filters
  filters.textFilters.forEach(tf => {
    filtered = filtered.filter(note => {
      let fieldValue = '';
      if (tf.field === 'all') {
        fieldValue = `${note.title} ${note.body} ${note.tags.join(' ')}`;
      } else if (tf.field === 'title') {
        fieldValue = note.title;
      } else if (tf.field === 'body') {
        fieldValue = note.body;
      } else if (tf.field === 'tags') {
        fieldValue = note.tags.join(' ');
      }
      if (!tf.caseSensitive) fieldValue = fieldValue.toLowerCase();
      let value = tf.caseSensitive ? tf.value : tf.value.toLowerCase();
      switch (tf.operator) {
        case 'contains':
          return fieldValue.includes(value);
        case 'equals':
          return fieldValue === value;
        case 'starts_with':
          return fieldValue.startsWith(value);
        case 'ends_with':
          return fieldValue.endsWith(value);
        case 'regex':
          try {
            const regex = new RegExp(value, tf.caseSensitive ? '' : 'i');
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        default:
          return true;
      }
    });
  });

  // Size filter
  if (filters.sizeRange.minLength > 0) {
    filtered = filtered.filter(note => note.body.length >= filters.sizeRange.minLength);
  }
  if (filters.sizeRange.maxLength > 0) {
    filtered = filtered.filter(note => note.body.length <= filters.sizeRange.maxLength);
  }

  // Sorting
  if (filters.sortBy === 'date') {
    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
  } else if (filters.sortBy === 'title') {
    filtered.sort((a, b) => {
      return filters.sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    });
  } else if (filters.sortBy === 'size') {
    filtered.sort((a, b) => {
      return filters.sortOrder === 'asc'
        ? a.body.length - b.body.length
        : b.body.length - a.body.length;
    });
  } else if (filters.sortBy === 'tags') {
    filtered.sort((a, b) => {
      return filters.sortOrder === 'asc'
        ? a.tags.length - b.tags.length
        : b.tags.length - a.tags.length;
    });
  }

  // Limit results
  if (filters.maxResults > 0) {
    filtered = filtered.slice(0, filters.maxResults);
  }

  return filtered;
} 