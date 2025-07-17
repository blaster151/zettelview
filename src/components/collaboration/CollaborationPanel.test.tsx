import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollaborationPanel from './CollaborationPanel';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useThemeStore } from '../../store/themeStore';

// Mock the hooks
jest.mock('../../hooks/useCollaboration');
jest.mock('../../store/themeStore');

const mockUseCollaboration = useCollaboration as jest.MockedFunction<typeof useCollaboration>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('CollaborationPanel', () => {
  const mockColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceHover: '#e9ecef',
    text: '#212529',
    textSecondary: '#6c757d',
    primary: '#007bff',
    primaryHover: '#0056b3',
    border: '#dee2e6'
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({
      colors: mockColors,
      toggleTheme: jest.fn()
    });

    mockUseCollaboration.mockReturnValue({
      state: {
        session: null,
        localUser: {
          id: 'user-1',
          name: 'Test User',
          color: '#ff0000',
          isOnline: true,
          lastSeen: new Date()
        },
        remoteCursors: [],
        pendingOperations: [],
        resolvedConflicts: [],
        isConnected: false,
        connectionStatus: 'disconnected'
      },
      config: {
        enableRealTimeSync: true,
        showUserCursors: true,
        showUserPresence: true,
        autoResolveConflicts: true,
        syncInterval: 1000,
        maxRetries: 3,
        retryDelay: 1000
      },
      createSession: jest.fn(),
      joinSession: jest.fn(),
      leaveSession: jest.fn(),
      updateCursor: jest.fn(),
      submitOperation: jest.fn(),
      updateConfig: jest.fn(),
      getOnlineUsers: jest.fn().mockReturnValue([]),
      getUserById: jest.fn(),
      isCollaborating: false,
      onlineUsersCount: 0,
      hasRemoteCursors: false,
      hasPendingOperations: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Collaboration')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('🤝 Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Session Management')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display connection status correctly', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should display connected status when connected', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        state: {
          ...mockUseCollaboration().state,
          isConnected: true,
          connectionStatus: 'connected'
        }
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('session management', () => {
    it('should show create session button when not collaborating', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('🚀 Create New Session')).toBeInTheDocument();
      expect(screen.getByText('🔗 Join Existing Session')).toBeInTheDocument();
    });

    it('should call createSession when create button is clicked', async () => {
      const mockCreateSession = jest.fn();
      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        createSession: mockCreateSession
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('🚀 Create New Session'));

      expect(mockCreateSession).toHaveBeenCalled();
    });

    it('should show join form when join button is clicked', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('🔗 Join Existing Session'));

      expect(screen.getByPlaceholderText('Enter session ID')).toBeInTheDocument();
      expect(screen.getByText('Join Session')).toBeInTheDocument();
    });

    it('should call joinSession when join form is submitted', async () => {
      const mockJoinSession = jest.fn();
      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        joinSession: mockJoinSession
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('🔗 Join Existing Session'));
      
      const sessionIdInput = screen.getByPlaceholderText('Enter session ID');
      fireEvent.change(sessionIdInput, { target: { value: 'session-123' } });
      
      fireEvent.click(screen.getByText('Join Session'));

      expect(mockJoinSession).toHaveBeenCalledWith('session-123');
    });

    it('should show session info when collaborating', () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        state: {
          ...mockUseCollaboration().state,
          session: mockSession,
          isConnected: true,
          connectionStatus: 'connected'
        },
        isCollaborating: true
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Session ID:')).toBeInTheDocument();
      expect(screen.getByText('session-123')).toBeInTheDocument();
      expect(screen.getByText('Leave Session')).toBeInTheDocument();
    });

    it('should call leaveSession when leave button is clicked', async () => {
      const mockLeaveSession = jest.fn();
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        state: {
          ...mockUseCollaboration().state,
          session: mockSession,
          isConnected: true,
          connectionStatus: 'connected'
        },
        isCollaborating: true,
        leaveSession: mockLeaveSession
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Leave Session'));

      expect(mockLeaveSession).toHaveBeenCalled();
    });
  });

  describe('online users', () => {
    it('should display online users when collaborating', () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1', color: '#ff0000', isOnline: true, lastSeen: new Date() },
        { id: 'user-2', name: 'User 2', color: '#00ff00', isOnline: true, lastSeen: new Date() }
      ];

      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: mockUsers,
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        state: {
          ...mockUseCollaboration().state,
          session: mockSession,
          isConnected: true,
          connectionStatus: 'connected'
        },
        isCollaborating: true,
        onlineUsersCount: 2,
        getOnlineUsers: jest.fn().mockReturnValue(mockUsers)
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Online Users (2)')).toBeInTheDocument();
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should not display online users section when not collaborating', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Online Users')).not.toBeInTheDocument();
    });
  });

  describe('settings', () => {
    it('should display all settings checkboxes', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Show user cursors')).toBeInTheDocument();
      expect(screen.getByText('Show user presence')).toBeInTheDocument();
      expect(screen.getByText('Auto-resolve conflicts')).toBeInTheDocument();
    });

    it('should call updateConfig when settings are changed', () => {
      const mockUpdateConfig = jest.fn();
      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        updateConfig: mockUpdateConfig
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const showCursorsCheckbox = screen.getByText('Show user cursors').previousElementSibling as HTMLInputElement;
      fireEvent.click(showCursorsCheckbox);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ showUserCursors: false });
    });
  });

  describe('statistics', () => {
    it('should display statistics when collaborating', () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockUseCollaboration.mockReturnValue({
        ...mockUseCollaboration(),
        state: {
          ...mockUseCollaboration().state,
          session: mockSession,
          isConnected: true,
          connectionStatus: 'connected',
          remoteCursors: [{ userId: 'user-2', userName: 'User 2', userColor: '#00ff00', position: { line: 1, ch: 0 } }],
          pendingOperations: [{ id: 'op-1', userId: 'user-2', timestamp: new Date(), type: 'insert', position: 0, version: 1 }],
          resolvedConflicts: [{ operationId: 'op-1', resolvedBy: 'user-1', resolution: 'accept', timestamp: new Date() }]
        },
        isCollaborating: true
      });

      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Remote cursors:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Pending operations:')).toBeInTheDocument();
      expect(screen.getByText('Resolved conflicts:')).toBeInTheDocument();
    });

    it('should not display statistics when not collaborating', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close collaboration panel/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking outside the modal', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const backdrop = screen.getByText('🤝 Collaboration').closest('div')?.parentElement;
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /close collaboration panel/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter session ID')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close collaboration panel/i });
      expect(closeButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('form validation', () => {
    it('should disable join button when session ID is empty', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('🔗 Join Existing Session'));
      
      const joinButton = screen.getByText('Join Session');
      expect(joinButton).toBeDisabled();
    });

    it('should enable join button when session ID is provided', () => {
      render(
        <CollaborationPanel
          noteId="test-note-id"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('🔗 Join Existing Session'));
      
      const sessionIdInput = screen.getByPlaceholderText('Enter session ID');
      fireEvent.change(sessionIdInput, { target: { value: 'session-123' } });
      
      const joinButton = screen.getByText('Join Session');
      expect(joinButton).not.toBeDisabled();
    });
  });
}); 