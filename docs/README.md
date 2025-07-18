# ZettelView Documentation

ZettelView is a sophisticated Markdown-based knowledge base application built with TypeScript, React, and modern web technologies. It provides advanced features for note-taking, knowledge management, and collaborative editing.

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with ES2020 support

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/zettelview.git
cd zettelview

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Quick Start

1. **Create your first note**: Press `Ctrl+N` or click the "New Note" button
2. **Switch views**: Use `Ctrl+1` (Editor), `Ctrl+2` (Graph), `Ctrl+3` (Calendar)
3. **Search notes**: Press `Ctrl+F` to focus the search
4. **Access command palette**: Press `Ctrl+Shift+C` for quick actions

## Features

### Core Features

#### 📝 **Advanced Note Editor**
- **Markdown Support**: Full Markdown syntax with live preview
- **Auto-save**: Automatic saving with configurable intervals
- **Templates**: Pre-built templates for common note types
- **Tags**: Organize notes with flexible tagging system
- **Links**: Internal linking between notes with `[[note-title]]` syntax

#### 🔍 **Enhanced Search**
- **Full-text Search**: Search across titles, content, and tags
- **Advanced Filters**: Filter by tags, dates, content types
- **Saved Queries**: Save and reuse complex search queries
- **Search History**: Track and revisit previous searches
- **Fuzzy Matching**: Find notes even with typos

#### 🕸️ **Graph Visualization**
- **Interactive Graph**: Visualize note relationships
- **Multiple Layouts**: Force-directed, hierarchical, and circular layouts
- **Filtering**: Filter nodes by tags, dates, and content
- **Performance Optimized**: Handles large datasets efficiently
- **Export Options**: Export graphs as images or data

#### 📅 **Calendar View**
- **Date-based Organization**: View notes by creation/update dates
- **Timeline Navigation**: Navigate through time periods
- **Event Indicators**: Visual indicators for notes with dates
- **Bulk Operations**: Select and manage multiple notes

### Advanced Features

#### 🤖 **AI Integration**
- **Smart Summaries**: AI-powered note summarization
- **Content Analysis**: Extract key topics and insights
- **Auto-tagging**: Suggest relevant tags based on content
- **Related Notes**: Find semantically similar notes

#### 🔌 **Plugin System**
- **Extensible Architecture**: Add custom functionality
- **Plugin Store**: Browse and install community plugins
- **Built-in Plugins**: Essential plugins included by default
- **Plugin Management**: Enable/disable and configure plugins

#### 👥 **Collaborative Editing**
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **User Cursors**: See other users' cursors in real-time
- **Conflict Resolution**: Automatic conflict detection and resolution
- **Permission System**: Granular access control

#### 📊 **Export & Import**
- **Multiple Formats**: JSON, Markdown, CSV, HTML, PDF
- **Bulk Operations**: Export/import entire knowledge bases
- **Custom Options**: Configure what data to include
- **Version Control**: Track changes and restore previous versions

### User Interface

#### 🎨 **Theme System**
- **Light/Dark Modes**: Automatic theme switching
- **Custom Themes**: Create and share custom themes
- **System Integration**: Follows system theme preferences
- **Accessibility**: High contrast and screen reader support

#### ⌨️ **Keyboard Shortcuts**
- **Comprehensive Shortcuts**: 50+ keyboard shortcuts
- **Command Palette**: Quick access to all features
- **Customizable**: Configure your own shortcuts
- **Context-aware**: Shortcuts adapt to current view

#### 📱 **Responsive Design**
- **Mobile-friendly**: Works on all device sizes
- **Touch Support**: Optimized for touch interfaces
- **Progressive Web App**: Install as native app
- **Offline Support**: Work without internet connection

## Architecture

### Technology Stack

- **Frontend**: React 18, TypeScript, Zustand
- **Styling**: CSS-in-JS with theme system
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier
- **Performance**: Custom performance monitoring

### Core Architecture

```
src/
├── components/          # React components
│   ├── features/       # Feature-specific components
│   ├── ui/            # Reusable UI components
│   └── graph/         # Graph visualization components
├── store/             # State management (Zustand)
├── services/          # Business logic and external APIs
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
└── tests/             # Test files
```

### State Management

ZettelView uses Zustand for state management with three main stores:

1. **NoteStore**: Manages notes, selection, and CRUD operations
2. **ThemeStore**: Handles theme, colors, and appearance
3. **UIStore**: Controls UI state, panels, and view modes

### Data Flow

```
User Action → Component → Store → Service → Storage
     ↑                                        ↓
     ← Component ← Store ← Service ← Storage ←
```

## API Reference

### Note API

#### `useNoteStore()`

Main hook for note operations.

```typescript
const {
  notes,           // Array of all notes
  selectedId,      // Currently selected note ID
  isLoading,       // Loading state
  error,           // Error state
  addNote,         // Add new note
  updateNote,      // Update existing note
  deleteNote,      // Delete note
  selectNote,      // Select note by ID
  searchNotes      // Search notes
} = useNoteStore();
```

#### Note Object Structure

```typescript
interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Theme API

#### `useThemeStore()`

Hook for theme and appearance management.

```typescript
const {
  theme,           // Current theme ('light' | 'dark' | 'auto')
  colors,          // Color scheme object
  isDark,          // Whether dark mode is active
  setTheme,        // Set theme
  toggleTheme      // Toggle between light/dark
} = useThemeStore();
```

### UI API

#### `useUIStore()`

Hook for UI state management.

```typescript
const {
  viewMode,        // Current view mode
  showAISummaryPanel,    // AI panel visibility
  showExportImport,      // Export/import panel visibility
  showTemplateSelector,  // Template selector visibility
  // ... other UI states
} = useUIStore();
```

### Plugin API

#### Plugin Development

```typescript
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  init: (context: PluginContext) => void;
  hooks?: PluginHook[];
}

interface PluginContext {
  app: AppInfo;
  notes: NoteAPI;
  ui: UIApi;
}
```

## Development Guide

### Setting Up Development Environment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up pre-commit hooks**:
   ```bash
   npm run prepare
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standard commit message format

### Component Guidelines

1. **Functional Components**: Use function components with hooks
2. **TypeScript**: Full type safety for all components
3. **Props Interface**: Define explicit prop interfaces
4. **Error Boundaries**: Wrap components in error boundaries
5. **Performance**: Use React.memo and useMemo where appropriate

### Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Monitor render times and memory usage

### Performance Optimization

1. **Code Splitting**: Lazy load heavy components
2. **Memoization**: Use React.memo and useMemo
3. **Virtualization**: For large lists and graphs
4. **Debouncing**: For search and auto-save
5. **Bundle Analysis**: Regular bundle size monitoring

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ComponentName.test.tsx

# Run E2E tests
npm run test:e2e
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── utils/         # Test utilities
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender } from '../utils/testUtils';
import { ComponentName } from '../components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    customRender(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    customRender(<ComponentName />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

## Deployment

### Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.zettelview.com
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

### Deployment Platforms

- **Vercel**: Recommended for static hosting
- **Netlify**: Alternative static hosting
- **GitHub Pages**: Free hosting for open source
- **Docker**: Containerized deployment

### Performance Monitoring

- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle Analysis**: Track bundle size changes
- **Error Tracking**: Monitor runtime errors
- **User Analytics**: Track feature usage

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes**: Follow coding standards
4. **Add tests**: Ensure good test coverage
5. **Commit changes**: Use conventional commits
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**: Provide detailed description

### Code Review Process

1. **Automated Checks**: CI/CD pipeline validation
2. **Code Review**: At least one approval required
3. **Testing**: All tests must pass
4. **Documentation**: Update docs if needed
5. **Merge**: Squash and merge to main

### Issue Reporting

When reporting issues, please include:

- **Environment**: OS, browser, version
- **Steps to reproduce**: Detailed steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Any error messages

### Feature Requests

For feature requests:

- **Use case**: Describe the problem you're solving
- **Proposed solution**: How you'd like it to work
- **Alternatives**: Other approaches considered
- **Mockups**: Visual examples if applicable

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.zettelview.com](https://docs.zettelview.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/zettelview/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/zettelview/discussions)
- **Email**: support@zettelview.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and version history. 