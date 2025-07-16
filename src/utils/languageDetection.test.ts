import { detectLanguage, getLanguageDisplayName } from './languageDetection';

describe('Language Detection', () => {
  describe('detectLanguage', () => {
    test('should detect JavaScript code', () => {
      const jsCode = `
        function hello() {
          console.log("Hello, World!");
          const message = "Hello";
          return message;
        }
      `;
      expect(detectLanguage(jsCode)).toBe('javascript');
    });

    test('should detect Python code', () => {
      const pythonCode = `
        def hello():
            print("Hello, World!")
            message = "Hello"
            return message
      `;
      expect(detectLanguage(pythonCode)).toBe('python');
    });

    test('should detect HTML code', () => {
      const htmlCode = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test</title>
        </head>
        <body>
            <div>Hello World</div>
        </body>
        </html>
      `;
      expect(detectLanguage(htmlCode)).toBe('html');
    });

    test('should detect CSS code', () => {
      const cssCode = `
        .container {
          color: red;
          background: blue;
          margin: 10px;
        }
      `;
      expect(detectLanguage(cssCode)).toBe('css');
    });

    test('should detect SQL code', () => {
      const sqlCode = `
        SELECT * FROM users WHERE id = 1;
        INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
      `;
      expect(detectLanguage(sqlCode)).toBe('sql');
    });

    test('should detect JSON code', () => {
      const jsonCode = `
        {
          "name": "John",
          "age": 30,
          "city": "New York"
        }
      `;
      expect(detectLanguage(jsonCode)).toBe('json');
    });

    test('should detect Bash code', () => {
      const bashCode = `
        #!/bin/bash
        echo "Hello World"
        cd /home/user
        ls -la
      `;
      expect(detectLanguage(bashCode)).toBe('bash');
    });

    test('should return text for unknown code', () => {
      const unknownCode = `
        This is just some random text
        that doesn't match any known patterns
      `;
      expect(detectLanguage(unknownCode)).toBe('text');
    });

    test('should handle empty code', () => {
      expect(detectLanguage('')).toBe('text');
      expect(detectLanguage('   ')).toBe('text');
    });

    test('should handle null/undefined input', () => {
      expect(detectLanguage(null as any)).toBe('text');
      expect(detectLanguage(undefined as any)).toBe('text');
    });

    test('should prioritize stronger patterns over keywords', () => {
      const jsCodeWithPythonKeywords = `
        function test() {
          // This has 'print' and 'def' in comments but is clearly JavaScript
          console.log("Hello");
          const result = true;
          return result;
        }
      `;
      expect(detectLanguage(jsCodeWithPythonKeywords)).toBe('javascript');
    });
  });

  describe('getLanguageDisplayName', () => {
    test('should return proper display names for known languages', () => {
      expect(getLanguageDisplayName('javascript')).toBe('JavaScript');
      expect(getLanguageDisplayName('python')).toBe('Python');
      expect(getLanguageDisplayName('html')).toBe('HTML');
      expect(getLanguageDisplayName('css')).toBe('CSS');
      expect(getLanguageDisplayName('sql')).toBe('SQL');
      expect(getLanguageDisplayName('bash')).toBe('Bash');
      expect(getLanguageDisplayName('json')).toBe('JSON');
      expect(getLanguageDisplayName('xml')).toBe('XML');
      expect(getLanguageDisplayName('text')).toBe('Text');
    });

    test('should capitalize unknown languages', () => {
      expect(getLanguageDisplayName('typescript')).toBe('Typescript');
      expect(getLanguageDisplayName('rust')).toBe('Rust');
      expect(getLanguageDisplayName('go')).toBe('Go');
    });

    test('should handle empty string', () => {
      expect(getLanguageDisplayName('')).toBe('');
    });
  });
}); 