import React from 'react';
import { UserCursor } from '../../types/collaboration';
import { useThemeStore } from '../../store/themeStore';

interface UserCursorsProps {
  cursors: UserCursor[];
  isVisible: boolean;
}

const UserCursors: React.FC<UserCursorsProps> = ({ cursors, isVisible }) => {
  const { colors } = useThemeStore();

  if (!isVisible || cursors.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: `${cursor.position.ch * 8}px`, // Approximate character width
            top: `${cursor.position.line * 20}px`, // Approximate line height
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'cursorBlink 1s infinite'
          }}
        >
          {/* Cursor line */}
          <div
            style={{
              width: '2px',
              height: '20px',
              background: cursor.userColor,
              borderRadius: '1px'
            }}
          />
          
          {/* User label */}
          <div
            style={{
              background: cursor.userColor,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              opacity: 0.9
            }}
          >
            {cursor.userName}
          </div>

          {/* Selection overlay */}
          {cursor.selection && (
            <div
              style={{
                position: 'absolute',
                left: `${cursor.selection.from.ch * 8}px`,
                top: `${cursor.selection.from.line * 20}px`,
                width: `${(cursor.selection.to.ch - cursor.selection.from.ch) * 8}px`,
                height: `${(cursor.selection.to.line - cursor.selection.from.line + 1) * 20}px`,
                background: cursor.userColor,
                opacity: 0.2,
                borderRadius: '2px'
              }}
            />
          )}
        </div>
      ))}

      <style>{`
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default UserCursors; 