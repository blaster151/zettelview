import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the problematic ES modules
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-preview">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

import App from './App';

test('renders sidebar and initial note', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Notes/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Welcome/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Welcome/i })).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Welcome to ZettelView!/i)).toBeInTheDocument();
});
