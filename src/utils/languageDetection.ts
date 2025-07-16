// Language detection utility for code blocks
// Detects programming language based on code content patterns

export interface LanguagePattern {
  language: string;
  patterns: RegExp[];
  keywords: string[];
  extensions: string[];
}

// Common language patterns for detection
const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    language: 'javascript',
    patterns: [
      /console\.log\(/,
      /function\s+\w+\s*\(/,
      /const\s+|let\s+|var\s+/,
      /=>\s*{/,
      /import\s+.*\s+from/,
      /export\s+(default\s+)?/,
      /\.js$/,
      /\.jsx$/,
      /\.ts$/,
      /\.tsx$/
    ],
    keywords: ['function', 'const', 'let', 'var', 'console', 'import', 'export', 'return', 'async', 'await'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  {
    language: 'python',
    patterns: [
      /def\s+\w+\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\s*\(/,
      /if\s+__name__\s*==\s*['"]__main__['"]/,
      /\.py$/
    ],
    keywords: ['def', 'import', 'from', 'print', 'if', 'else', 'elif', 'for', 'while', 'class'],
    extensions: ['.py', '.pyw']
  },
  {
    language: 'html',
    patterns: [
      /<!DOCTYPE\s+html>/i,
      /<html[^>]*>/i,
      /<head[^>]*>/i,
      /<body[^>]*>/i,
      /<div[^>]*>/i,
      /<span[^>]*>/i,
      /<p[^>]*>/i,
      /\.html$/,
      /\.htm$/
    ],
    keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style'],
    extensions: ['.html', '.htm', '.xhtml']
  },
  {
    language: 'css',
    patterns: [
      /{[^}]*}/,
      /[.#]\w+\s*{/,
      /@media\s+/,
      /@keyframes\s+/,
      /\.css$/
    ],
    keywords: ['color', 'background', 'margin', 'padding', 'border', 'font', 'display', 'position'],
    extensions: ['.css', '.scss', '.sass', '.less']
  },
  {
    language: 'sql',
    patterns: [
      /SELECT\s+.+FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.+SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /\.sql$/
    ],
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'],
    extensions: ['.sql']
  },
  {
    language: 'bash',
    patterns: [
      /#!/,
      /echo\s+/,
      /cd\s+/,
      /ls\s+/,
      /grep\s+/,
      /awk\s+/,
      /sed\s+/,
      /\.sh$/,
      /\.bash$/
    ],
    keywords: ['echo', 'cd', 'ls', 'grep', 'awk', 'sed', 'cat', 'chmod', 'chown'],
    extensions: ['.sh', '.bash', '.zsh']
  },
  {
    language: 'json',
    patterns: [
      /^\s*{/,
      /^\s*\[/,
      /"[\w-]+"\s*:/,
      /\.json$/
    ],
    keywords: ['true', 'false', 'null'],
    extensions: ['.json']
  },
  {
    language: 'xml',
    patterns: [
      /<\?xml/,
      /<[a-zA-Z][^>]*>/,
      /<\/[a-zA-Z][^>]*>/,
      /\.xml$/,
      /\.svg$/
    ],
    keywords: ['xml', 'version', 'encoding', 'xmlns'],
    extensions: ['.xml', '.svg', '.rss', '.atom']
  }
];

/**
 * Detect programming language based on code content
 * @param code - The code content to analyze
 * @returns The detected language or 'text' if no match found
 */
export function detectLanguage(code: string): string {
  if (!code || typeof code !== 'string') {
    return 'text';
  }

  const normalizedCode = code.trim();
  if (normalizedCode.length === 0) {
    return 'text';
  }

  // Score each language based on pattern matches
  const scores: Record<string, number> = {};

  for (const langPattern of LANGUAGE_PATTERNS) {
    let score = 0;

    // Check patterns
    for (const pattern of langPattern.patterns) {
      if (pattern.test(normalizedCode)) {
        score += 2; // Pattern matches are strong indicators
      }
    }

    // Check keywords
    const words = normalizedCode.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (langPattern.keywords.some(keyword => 
        word.includes(keyword.toLowerCase())
      )) {
        score += 1; // Keyword matches are weaker indicators
      }
    }

    // Check for language-specific syntax
    if (langPattern.language === 'javascript' && 
        (normalizedCode.includes('console.log') || normalizedCode.includes('function'))) {
      score += 3;
    }
    
    if (langPattern.language === 'python' && 
        (normalizedCode.includes('def ') || normalizedCode.includes('print('))) {
      score += 3;
    }

    if (langPattern.language === 'html' && 
        (normalizedCode.includes('<html') || normalizedCode.includes('<!DOCTYPE'))) {
      score += 3;
    }

    if (langPattern.language === 'css' && 
        (normalizedCode.includes('{') && normalizedCode.includes('}'))) {
      score += 2;
    }

    if (langPattern.language === 'sql' && 
        /SELECT|INSERT|UPDATE|DELETE|CREATE/i.test(normalizedCode)) {
      score += 3;
    }

    if (langPattern.language === 'json' && 
        (normalizedCode.startsWith('{') || normalizedCode.startsWith('['))) {
      score += 2;
    }

    if (score > 0) {
      scores[langPattern.language] = score;
    }
  }

  // Return the language with the highest score
  const detectedLanguage = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0];

  return detectedLanguage ? detectedLanguage[0] : 'text';
}

/**
 * Get language display name
 * @param language - The language code
 * @returns The display name for the language
 */
export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'bash': 'Bash',
    'json': 'JSON',
    'xml': 'XML',
    'text': 'Text'
  };

  return displayNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
} 