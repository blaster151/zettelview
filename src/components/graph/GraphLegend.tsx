import React from 'react';
import { GraphRenderMode } from '../../types/graph';
import { ThemeColors } from '../../types/theme';

interface GraphLegendProps {
  renderMode: GraphRenderMode;
  nodeCount: number;
  linkCount: number;
  colors: ThemeColors;
}

const GraphLegend: React.FC<GraphLegendProps> = ({
  renderMode,
  nodeCount,
  linkCount,
  colors
}) => {
  const getRenderModeInfo = () => {
    switch (renderMode) {
      case 'internal-links':
        return {
          name: 'Internal Links',
          description: 'Shows explicit connections via [[Note Title]] references',
          icon: '🔗'
        };
      case 'tag-based':
        return {
          name: 'Tag Clusters',
          description: 'Connects notes that share tags to show thematic relationships',
          icon: '🏷️'
        };
      case 'content-similarity':
        return {
          name: 'Content Similarity',
          description: 'Connects notes with similar content and keywords',
          icon: '📝'
        };
      case 'hybrid':
        return {
          name: 'Hybrid View',
          description: 'Combines internal links and tag connections for complete picture',
          icon: '🔀'
        };
      case 'hierarchical':
        return {
          name: 'Hierarchical',
          description: 'Shows parent-child relationships based on note titles',
          icon: '📊'
        };
      default:
        return {
          name: 'Unknown',
          description: 'Unknown render mode',
          icon: '❓'
        };
    }
  };

  const renderModeInfo = getRenderModeInfo();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Render mode info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16px' }}>{renderModeInfo.icon}</span>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: colors.text
          }}>
            {renderModeInfo.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: colors.textSecondary
          }}>
            {renderModeInfo.description}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: colors.textSecondary
      }}>
        <div>
          <span style={{ fontWeight: 'bold', color: colors.text }}>
            {nodeCount}
          </span> nodes
        </div>
        <div>
          <span style={{ fontWeight: 'bold', color: colors.text }}>
            {linkCount}
          </span> connections
        </div>
        <div>
          Avg: <span style={{ fontWeight: 'bold', color: colors.text }}>
            {nodeCount > 0 ? (linkCount / nodeCount).toFixed(1) : '0'}
          </span> links/node
        </div>
      </div>

      {/* Link type legend */}
      <div style={{
        display: 'flex',
        gap: '12px',
        fontSize: '11px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: colors.primary,
            borderRadius: '1px'
          }} />
          <span style={{ color: colors.textSecondary }}>Internal</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: colors.secondary,
            borderRadius: '1px'
          }} />
          <span style={{ color: colors.textSecondary }}>Tag</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: colors.accent,
            borderRadius: '1px'
          }} />
          <span style={{ color: colors.textSecondary }}>Similarity</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: colors.warning,
            borderRadius: '1px'
          }} />
          <span style={{ color: colors.textSecondary }}>Hierarchical</span>
        </div>
      </div>

      {/* Interaction hints */}
      <div style={{
        fontSize: '11px',
        color: colors.textSecondary,
        fontStyle: 'italic'
      }}>
        💡 Drag nodes • Scroll to zoom • Click to select
      </div>
    </div>
  );
};

export default GraphLegend; 