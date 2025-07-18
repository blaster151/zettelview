import React from 'react';
import { useNoteStore } from '../store/noteStore';

const StoragePermission: React.FC = () => {
  const storagePermission = useNoteStore(state => state.storagePermission);
  const isInitialized = useNoteStore(state => state.isInitialized);
  const requestStoragePermission = useNoteStore(state => state.requestStoragePermission);

  if (!isInitialized) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div>Initializing...</div>
      </div>
    );
  }

  if (storagePermission) {
    return (
      <div style={{ 
        padding: '8px 16px', 
        background: '#e8f5e8', 
        color: '#2d5a2d',
        fontSize: '12px',
        borderBottom: '1px solid #eee'
      }}>
        ✓ Notes saved to local files
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '12px 16px', 
      background: '#fff3cd', 
      color: '#856404',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <strong>Local Storage</strong>
        <div style={{ fontSize: '12px', marginTop: '2px' }}>
          Enable file system access to save notes locally
        </div>
      </div>
      <button
        onClick={requestStoragePermission}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Enable
      </button>
    </div>
  );
};

export default StoragePermission; 