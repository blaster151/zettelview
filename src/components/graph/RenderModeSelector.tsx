import React from 'react';
import { GraphRenderMode, GRAPH_RENDER_MODES } from '../../types/graph';

interface RenderModeSelectorProps {
  currentMode: GraphRenderMode;
  onModeChange: (mode: GraphRenderMode) => void;
}

const RenderModeSelector: React.FC<RenderModeSelectorProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  const currentConfig = GRAPH_RENDER_MODES.find(mode => mode.id === currentMode);

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      background: 'white',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      padding: '8px',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: '600', color: '#586069' }}>
        Render Mode
      </div>
      
      <select
        value={currentMode}
        onChange={(e) => onModeChange(e.target.value as GraphRenderMode)}
        style={{
          width: '100%',
          padding: '6px 8px',
          border: '1px solid #e1e4e8',
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white',
          color: '#24292e'
        }}
      >
        {GRAPH_RENDER_MODES.map(mode => (
          <option key={mode.id} value={mode.id}>
            {mode.icon} {mode.name}
          </option>
        ))}
      </select>
      
      {currentConfig && (
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#586069',
          lineHeight: '1.3'
        }}>
          {currentConfig.description}
        </div>
      )}
    </div>
  );
};

export default RenderModeSelector; 