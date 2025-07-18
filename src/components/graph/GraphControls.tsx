import React, { useCallback } from 'react';
import { ThemeColors } from '../../types/theme';

interface GraphControlsProps {
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  colors: ThemeColors;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  colors
}) => {
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(3, zoom * 1.2);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.1, zoom / 1.2);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleResetView = useCallback(() => {
    onZoomChange(1);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  const handleFitToView = useCallback(() => {
    // This would calculate the optimal zoom and pan to fit all nodes
    // For now, just reset to a reasonable view
    onZoomChange(0.8);
    onPanChange({ x: 50, y: 50 });
  }, [onZoomChange, onPanChange]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      {/* Zoom controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: '32px',
            height: '32px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        
        <div style={{
          textAlign: 'center',
          fontSize: '10px',
          color: colors.textSecondary,
          padding: '2px 0'
        }}>
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={handleZoomOut}
          style={{
            width: '32px',
            height: '32px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Divider */}
      <div style={{
        width: '100%',
        height: '1px',
        background: colors.border,
        margin: '4px 0'
      }} />

      {/* View controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <button
          onClick={handleResetView}
          style={{
            width: '32px',
            height: '24px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title="Reset view"
          aria-label="Reset view"
        >
          ⌂
        </button>
        
        <button
          onClick={handleFitToView}
          style={{
            width: '32px',
            height: '24px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title="Fit to view"
          aria-label="Fit to view"
        >
          ⤢
        </button>
      </div>

      {/* Pan controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <button
          onClick={() => onPanChange({ ...pan, y: pan.y - 50 })}
          style={{
            width: '32px',
            height: '24px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title="Pan up"
          aria-label="Pan up"
        >
          ↑
        </button>
        
        <div style={{
          display: 'flex',
          gap: '2px'
        }}>
          <button
            onClick={() => onPanChange({ ...pan, x: pan.x - 50 })}
            style={{
              width: '24px',
              height: '24px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
            title="Pan left"
            aria-label="Pan left"
          >
            ←
          </button>
          
          <button
            onClick={() => onPanChange({ ...pan, x: pan.x + 50 })}
            style={{
              width: '24px',
              height: '24px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
            title="Pan right"
            aria-label="Pan right"
          >
            →
          </button>
        </div>
        
        <button
          onClick={() => onPanChange({ ...pan, y: pan.y + 50 })}
          style={{
            width: '32px',
            height: '24px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title="Pan down"
          aria-label="Pan down"
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default GraphControls; 