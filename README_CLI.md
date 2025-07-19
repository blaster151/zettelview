# Zettelkasten CLI with Shared Core Module

This project now has a shared core module that powers both the CLI and React GUI, following the recommended architecture pattern.

## Project Structure

```
/zettelview/
  /core/               <-- Shared logic (parsing, IO, summarization, etc.)
    types.ts           <-- All TypeScript interfaces and types
    blockParser.ts     <-- Smart block parsing and generation
    fileManager.ts     <-- File I/O operations
    summaryEngine.ts   <-- AI operations and summarization
    index.ts           <-- Core module exports
  /cli/
    index.ts           <-- CLI entrypoint using Commander.js
  /src/
    /services/
      smartBlocksCoreService.ts  <-- React service using core module
    /hooks/
      useSmartBlocks.ts          <-- React hook using core module
    /components/
      SmartBlocks.tsx            <-- React UI component
```

## CLI Commands

The CLI provides powerful command-line tools for managing smart blocks:

### Basic Commands

```bash
# Parse smart blocks from a markdown file
zett parse note.md

# Parse and output to file
zett parse note.md -o blocks.json -f json

# Extract blocks with filters
zett extract note.md -t summary -g "important,urgent" -o extracted.md

# Generate summaries for all blocks
zett summarize note.md -o summaries.json

# Summarize specific block
zett summarize note.md -b block-123

# Reorder blocks based on AI suggestions
zett reorder note.md -o reordered.md

# Preview reorder suggestions without applying
zett reorder note.md -p

# Process multiple files
zett process note1.md note2.md -o "summarize,embed" -d ./processed/

# Validate smart blocks
zett validate note.md -s

# Show file statistics
zett stats note.md

# Search for content
zett search ./notes "smart blocks"
```

### Installation and Usage

```bash
# Install dependencies
npm install

# Run CLI directly
npm run cli -- parse note.md

# Or install globally
npm link
zett parse note.md
```

## Shared Core Module

The core module provides:

### BlockParser
- Parse smart blocks from markdown content
- Generate block markers
- Insert/remove/update blocks in markdown
- Validate block structure

### FileManager
- Read/write markdown files
- Load/save metadata
- Process multiple files
- Search functionality
- File statistics

### SummaryEngine
- Generate AI summaries
- Extract blocks with filters
- Reorder blocks intelligently
- Generate embeddings
- Batch processing

## Benefits

1. **Consistency**: Same logic used in CLI and GUI
2. **Maintainability**: Single source of truth for core functionality
3. **Automation**: CLI enables scripting and batch operations
4. **Integration**: Easy to integrate with Git hooks, CI/CD, etc.
5. **Power User Features**: Advanced operations via command line

## Example Workflows

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
zett validate *.md -s
zett process *.md -o "summarize"
```

### Batch Processing
```bash
# Process all notes in a directory
for file in notes/*.md; do
  zett process "$file" -o "summarize,embed" -d ./processed/
done
```

### Content Analysis
```bash
# Get statistics for all notes
for file in notes/*.md; do
  echo "=== $file ==="
  zett stats "$file"
done
```

## Development

The core module is designed to be:
- **Framework agnostic**: Works with React, Node.js, or any JavaScript environment
- **Extensible**: Easy to add new AI operations or file formats
- **Testable**: Pure functions with clear interfaces
- **Performant**: Efficient parsing and processing algorithms

## Next Steps

1. **AI Integration**: Replace placeholder AI operations with real implementations
2. **Milkdown Integration**: Connect smart block nodes to the editor
3. **Advanced Features**: Add more CLI commands and core functionality
4. **Testing**: Add comprehensive tests for core module and CLI
5. **Documentation**: Expand usage examples and API documentation 