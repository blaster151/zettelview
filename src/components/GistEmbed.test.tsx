import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GistEmbed from './features/GistEmbed';

// Mock fetch
global.fetch = jest.fn();

const mockGistData = {
  id: 'test-gist-id',
  description: 'Test Gist Description',
  files: {
    'test.js': {
      filename: 'test.js',
      language: 'JavaScript',
      content: 'console.log("Hello, World!");',
      size: 1024
    },
    'test.py': {
      filename: 'test.py',
      language: 'Python',
      content: 'print("Hello, World!")',
      size: 512
    }
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  owner: {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg'
  }
};

describe('GistEmbed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    render(<GistEmbed url="https://gist.github.com/testuser/abc123def456" />);
    
    expect(screen.getByText('Loading Gist...')).toBeInTheDocument();
  });

  test('renders Gist data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGistData
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/abc123def456" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Gist Description')).toBeInTheDocument();
    });
    
    expect(screen.getByText('by testuser • 2 files')).toBeInTheDocument();
    expect(screen.getByText('test.js')).toBeInTheDocument();
    expect(screen.getByText('test.py')).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello, World!");')).toBeInTheDocument();
    expect(screen.getByText('print("Hello, World!")')).toBeInTheDocument();
  });

  test('handles Gist with no description', async () => {
    const gistWithoutDescription = {
      ...mockGistData,
      description: null
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => gistWithoutDescription
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Gist')).toBeInTheDocument();
    });
  });

  test('handles single file Gist', async () => {
    const singleFileGist = {
      ...mockGistData,
      files: {
        'test.js': mockGistData.files['test.js']
      }
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => singleFileGist
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('by testuser • 1 file')).toBeInTheDocument();
    });
  });

  test('handles invalid Gist URL', () => {
    render(<GistEmbed url="https://invalid-url.com" />);
    
    expect(screen.getByText('Failed to load Gist:')).toBeInTheDocument();
    expect(screen.getByText('Invalid Gist URL')).toBeInTheDocument();
    expect(screen.getByText('View on GitHub →')).toBeInTheDocument();
  });

  test('handles API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/nonexistent-gist" />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load Gist: Failed to fetch Gist: 404')).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load Gist: Network error')).toBeInTheDocument();
    });
  });

  test('displays file sizes correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGistData
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('(1 KB)')).toBeInTheDocument(); // 1024 bytes = 1 KB
      expect(screen.getByText('(1 KB)')).toBeInTheDocument(); // 512 bytes = 0.5 KB, rounded to 1 KB
    });
  });

  test('renders owner avatar', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGistData
    });
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      const avatar = screen.getByAltText('testuser');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  test('provides fallback link on error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<GistEmbed url="https://gist.github.com/testuser/test-gist-id" />);
    
    await waitFor(() => {
      const fallbackLink = screen.getByText('View on GitHub →');
      expect(fallbackLink).toHaveAttribute('href', 'https://gist.github.com/testuser/test-gist-id');
      expect(fallbackLink).toHaveAttribute('target', '_blank');
      expect(fallbackLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('extracts Gist ID from various URL formats', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGistData
    });
    
    const { rerender } = render(<GistEmbed url="https://gist.github.com/testuser/abc123" />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/gists/abc123');
    });
    
    jest.clearAllMocks();
    
    rerender(<GistEmbed url="https://gist.github.com/anotheruser/def456" />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/gists/def456');
    });
  });
}); 