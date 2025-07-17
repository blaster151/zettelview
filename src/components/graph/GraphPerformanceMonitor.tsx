import React, { useState, useEffect } from 'react';
import { OptimizedGraphData } from '../../services/graphOptimizationService';

interface GraphPerformanceMonitorProps {
  graphData: OptimizedGraphData;
  onPerformanceModeChange: (mode: 'quality' | 'performance' | 'auto') => void;
  currentMode: 'quality' | 'performance' | 'auto';
}

const GraphPerformanceMonitor: React.FC<GraphPerformanceMonitorProps> = ({
  graphData,
  onPerformanceModeChange,
  currentMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { performanceMetrics, totalNodes, totalLinks, clusteringLevel } = graphData;
  const { cullingEfficiency, clusteringEfficiency, renderTime } = performanceMetrics;

  // Calculate performance score (0-100)
  const performanceScore = Math.max(0, Math.min(100, 
    100 - (renderTime / 16) * 50 + // Penalize slow rendering
    cullingEfficiency * 30 + // Reward good culling
    clusteringEfficiency * 20 // Reward good clustering
  ));

  // Get performance status
  const getPerformanceStatus = () => {
    if (performanceScore >= 80) return { status: 'Excellent', color: '#28a745' };
    if (performanceScore >= 60) return { status: 'Good', color: '#17a2b8' };
    if (performanceScore >= 40) return { status: 'Fair', color: '#ffc107' };
    return { status: 'Poor', color: '#dc3545' };
  };

  const { status, color } = getPerformanceStatus();

  // Get recommendations
  const recommendations = [
    ...(renderTime > 16 ? ['Consider enabling higher clustering level'] : []),
    ...(cullingEfficiency < 0.3 ? ['Zoom out to improve culling efficiency'] : []),
    ...(totalNodes > 200 ? ['Large graph detected - use performance mode'] : []),
    ...(clusteringLevel === 'none' && totalNodes > 100 ? ['Enable clustering for better performance'] : [])
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      minWidth: '200px',
      backdropFilter: 'blur(4px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: 'bold' }}>Graph Performance</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              color: '#666'
            }}
            title="Show recommendations"
          >
            💡
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              color: '#666'
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Performance Score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '40px',
          height: '8px',
          background: '#eee',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${performanceScore}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ color, fontWeight: 'bold' }}>{status}</span>
      </div>

      {/* Basic Stats */}
      <div style={{ marginBottom: '8px' }}>
        <div>Nodes: {graphData.visibleNodes.length}/{totalNodes}</div>
        <div>Links: {graphData.visibleLinks.length}/{totalLinks}</div>
        <div>Render: {renderTime.toFixed(1)}ms</div>
      </div>

      {/* Performance Mode Selector */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Mode:</label>
        <select
          value={currentMode}
          onChange={(e) => onPerformanceModeChange(e.target.value as any)}
          style={{
            width: '100%',
            padding: '2px 4px',
            fontSize: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="auto">Auto</option>
          <option value="quality">Quality</option>
          <option value="performance">Performance</option>
        </select>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
          <div style={{ marginBottom: '4px' }}>
            <span>Clustering: </span>
            <span style={{ 
              color: clusteringLevel === 'none' ? '#666' : '#007bff',
              fontWeight: clusteringLevel !== 'none' ? 'bold' : 'normal'
            }}>
              {clusteringLevel}
            </span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span>Culling: </span>
            <span style={{ color: cullingEfficiency > 0.5 ? '#28a745' : '#ffc107' }}>
              {(cullingEfficiency * 100).toFixed(0)}%
            </span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span>Clustering: </span>
            <span style={{ color: clusteringEfficiency > 0.3 ? '#28a745' : '#666' }}>
              {(clusteringEfficiency * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span>FPS: </span>
            <span style={{ color: renderTime < 16 ? '#28a745' : '#dc3545' }}>
              {(1000 / renderTime).toFixed(0)}
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Recommendations:</div>
          {recommendations.map((rec, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>• {rec}</div>
          ))}
        </div>
      )}

      {/* Performance Warnings */}
      {renderTime > 33 && (
        <div style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#856404'
        }}>
          ⚠️ Slow rendering detected. Consider performance mode.
        </div>
      )}
    </div>
  );
};

export default GraphPerformanceMonitor; 