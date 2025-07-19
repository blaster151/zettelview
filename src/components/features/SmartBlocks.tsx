import React, { useState, useCallback } from 'react';
import { 
  SmartBlock, 
  BlockType, 
  BlockMetadata, 
  BlockRenderOptions,
  BlockFilter,
  BlockSort,
  BlockInsertionOptions,
  BlockExtractionOptions,
  BlockSummarizationOptions
} from '../../types/smartBlocks';
import { useSmartBlocks } from '../../hooks/useSmartBlocks';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { Dropdown } from '../ui/Dropdown';

interface SmartBlocksProps {
  noteId?: string;
  onBlockExtracted?: (noteId: string) => void;
  onBlockUpdated?: (blockId: string) => void;
}

export const SmartBlocks: React.FC<SmartBlocksProps> = ({
  noteId,
  onBlockExtracted,
  onBlockUpdated
}) => {
  const theme = useTheme();
  const {
    blocks,
    metadata,
    selectedBlockId,
    isReorderMode,
    showBlocks,
    processingJobs,
    statistics,
    createBlock,
    updateBlock,
    deleteBlock,
    selectBlock,
    toggleReorderMode,
    toggleShowBlocks,
    extractBlock,
    summarizeBlock,
    suggestReorder,
    processBlocks,
    filterBlocks,
    sortBlocks,
    getFilteredBlocks,
    updateBlockMetadata,
    getBlockById,
    getBlockMetadata,
    updateRenderOptions
  } = useSmartBlocks({
    noteId,
    autoParse: true,
    autoSave: true,
    onBlockEvent: (event) => {
      if (event.type === 'extracted' && onBlockExtracted) {
        onBlockExtracted(event.data.targetNoteId);
      }
      if (event.type === 'updated' && onBlockUpdated) {
        onBlockUpdated(event.blockId);
      }
    }
  });

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [selectedBlockForAction, setSelectedBlockForAction] = useState<SmartBlock | null>(null);
  const [filter, setFilter] = useState<BlockFilter>({});
  const [sort, setSort] = useState<BlockSort>({ field: 'position', direction: 'asc' });
  const [renderOptions, setRenderOptions] = useState<BlockRenderOptions>({
    showBorders: true,
    showTypeIcons: true,
    showTags: true,
    showActions: true,
    highlightReorderable: true,
    showMetadata: false
  });

  // Form state for creating blocks
  const [newBlockContent, setNewBlockContent] = useState('');
  const [newBlockOptions, setNewBlockOptions] = useState<BlockInsertionOptions>({
    type: 'note',
    title: '',
    tags: [],
    reorderable: false
  });

  // Form state for extraction
  const [extractOptions, setExtractOptions] = useState<BlockExtractionOptions>({
    createBacklink: true,
    inheritTags: true,
    addSourceReference: true
  });

  // Form state for summarization
  const [summarizeOptions, setSummarizeOptions] = useState<BlockSummarizationOptions>({
    model: 'gpt-3.5-turbo',
    maxLength: 150,
    style: 'concise',
    includeContext: false
  });

  // Get filtered and sorted blocks
  const filteredBlocks = getFilteredBlocks(filter, sort);

  // Block type icons
  const getBlockTypeIcon = (type: BlockType): string => {
    const icons: Record<BlockType, string> = {
      summary: '📝',
      zettel: '🧠',
      quote: '💬',
      argument: '⚖️',
      definition: '📖',
      example: '💡',
      question: '❓',
      insight: '💭',
      todo: '✅',
      note: '📄'
    };
    return icons[type] || '📄';
  };

  // Block type colors
  const getBlockTypeColor = (type: BlockType): string => {
    const colors: Record<BlockType, string> = {
      summary: theme.colors.primary,
      zettel: theme.colors.secondary,
      quote: theme.colors.accent,
      argument: theme.colors.warning,
      definition: theme.colors.info,
      example: theme.colors.success,
      question: theme.colors.warning,
      insight: theme.colors.primary,
      todo: theme.colors.success,
      note: theme.colors.text
    };
    return colors[type] || theme.colors.text;
  };

  // Handle block creation
  const handleCreateBlock = useCallback(() => {
    if (!newBlockContent.trim()) return;

    try {
      createBlock(newBlockContent, newBlockOptions);
      setNewBlockContent('');
      setNewBlockOptions({
        type: 'note',
        title: '',
        tags: [],
        reorderable: false
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  }, [newBlockContent, newBlockOptions, createBlock]);

  // Handle block extraction
  const handleExtractBlock = useCallback(async () => {
    if (!selectedBlockForAction) return;

    try {
      await extractBlock(selectedBlockForAction.id, extractOptions);
      setShowExtractModal(false);
      setSelectedBlockForAction(null);
    } catch (error) {
      console.error('Failed to extract block:', error);
    }
  }, [selectedBlockForAction, extractOptions, extractBlock]);

  // Handle block summarization
  const handleSummarizeBlock = useCallback(async () => {
    if (!selectedBlockForAction) return;

    try {
      const summary = await summarizeBlock(selectedBlockForAction.id, summarizeOptions);
      setShowSummarizeModal(false);
      setSelectedBlockForAction(null);
    } catch (error) {
      console.error('Failed to summarize block:', error);
    }
  }, [selectedBlockForAction, summarizeOptions, summarizeBlock]);

  // Handle block actions
  const handleBlockAction = useCallback((action: string, block: SmartBlock) => {
    switch (action) {
      case 'extract':
        setSelectedBlockForAction(block);
        setShowExtractModal(true);
        break;
      case 'summarize':
        setSelectedBlockForAction(block);
        setShowSummarizeModal(true);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this block?')) {
          deleteBlock(block.id);
        }
        break;
      case 'edit':
        selectBlock(block.id);
        break;
    }
  }, [deleteBlock, selectBlock]);

  // Handle reorder suggestions
  const handleReorderSuggestions = useCallback(async () => {
    try {
      const suggestions = await suggestReorder();
      // In a real implementation, you would apply these suggestions
      console.log('Reorder suggestions:', suggestions);
    } catch (error) {
      console.error('Failed to generate reorder suggestions:', error);
    }
  }, [suggestReorder]);

  // Handle batch processing
  const handleBatchProcess = useCallback(async () => {
    try {
      const jobs = await processBlocks(['summarize', 'embed']);
      console.log('Processing jobs:', jobs);
    } catch (error) {
      console.error('Failed to process blocks:', error);
    }
  }, [processBlocks]);

  return (
    <div className="smart-blocks" style={{ color: theme.colors.text }}>
      {/* Header */}
      <div className="smart-blocks-header" style={{ 
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="header-left">
          <h3 style={{ margin: 0, color: theme.colors.text }}>
            Smart Blocks ({blocks.length})
          </h3>
          <div className="statistics" style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
            {statistics.reorderableBlocks} reorderable • {statistics.blocksWithAI} with AI • {statistics.extractedBlocks} extracted
          </div>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            style={{ borderColor: theme.colors.border }}
          >
            <Icon name="plus" size={16} />
            New Block
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowBlocks}
            style={{ borderColor: theme.colors.border }}
          >
            <Icon name={showBlocks ? "eye-off" : "eye"} size={16} />
            {showBlocks ? 'Hide' : 'Show'} Blocks
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleReorderMode}
            style={{ 
              borderColor: theme.colors.border,
              backgroundColor: isReorderMode ? theme.colors.primary : 'transparent',
              color: isReorderMode ? theme.colors.surface : theme.colors.text
            }}
          >
            <Icon name="move" size={16} />
            Reorder
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="smart-blocks-controls" style={{ 
        padding: '1rem',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div className="filter-group">
          <label style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginRight: '0.5rem' }}>
            Type:
          </label>
          <Select
            value={filter.types?.[0] || 'all'}
            onChange={(value) => setFilter(prev => ({ 
              ...prev, 
              types: value === 'all' ? undefined : [value as BlockType] 
            }))}
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Types</option>
            {['summary', 'zettel', 'quote', 'argument', 'definition', 'example', 'question', 'insight', 'todo', 'note'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginRight: '0.5rem' }}>
            Sort:
          </label>
          <Select
            value={`${sort.field}-${sort.direction}`}
            onChange={(value) => {
              const [field, direction] = value.split('-');
              setSort({ field: field as any, direction: direction as 'asc' | 'desc' });
            }}
            style={{ minWidth: '120px' }}
          >
            <option value="position-asc">Position (A-Z)</option>
            <option value="position-desc">Position (Z-A)</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
            <option value="length-asc">Length (Short-Long)</option>
            <option value="length-desc">Length (Long-Short)</option>
          </Select>
        </div>

        <div className="filter-group">
          <Input
            placeholder="Search blocks..."
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            style={{ minWidth: '200px' }}
          />
        </div>

        <div className="filter-group">
          <Checkbox
            checked={filter.reorderable || false}
            onChange={(checked) => setFilter(prev => ({ 
              ...prev, 
              reorderable: checked ? true : undefined 
            }))}
            label="Reorderable only"
          />
        </div>

        <div className="filter-group">
          <Checkbox
            checked={filter.hasAI || false}
            onChange={(checked) => setFilter(prev => ({ 
              ...prev, 
              hasAI: checked ? true : undefined 
            }))}
            label="With AI"
          />
        </div>
      </div>

      {/* Blocks List */}
      {showBlocks && (
        <div className="smart-blocks-list" style={{ padding: '1rem' }}>
          {filteredBlocks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: theme.colors.textSecondary 
            }}>
              No blocks found. Create your first smart block!
            </div>
          ) : (
            filteredBlocks.map((block, index) => {
              const blockMetadata = getBlockMetadata(block.id);
              const isSelected = selectedBlockId === block.id;
              
              return (
                <div
                  key={block.id}
                  className={`smart-block ${isSelected ? 'selected' : ''} ${block.reorderable ? 'reorderable' : ''}`}
                  style={{
                    border: renderOptions.showBorders ? `1px solid ${theme.colors.border}` : 'none',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surface,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => selectBlock(block.id)}
                >
                  {/* Block Header */}
                  <div className="block-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div className="block-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {renderOptions.showTypeIcons && (
                        <span style={{ fontSize: '1.2rem' }}>
                          {getBlockTypeIcon(block.type)}
                        </span>
                      )}
                      
                      <div>
                        <div className="block-title" style={{ 
                          fontWeight: '600',
                          color: theme.colors.text,
                          marginBottom: '0.25rem'
                        }}>
                          {block.title || `${block.type} block`}
                        </div>
                        
                        <div className="block-meta" style={{ 
                          fontSize: '0.875rem',
                          color: theme.colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ 
                            color: getBlockTypeColor(block.type),
                            fontWeight: '500'
                          }}>
                            {block.type}
                          </span>
                          
                          {block.reorderable && (
                            <Badge variant="outline" style={{ fontSize: '0.75rem' }}>
                              🔀 Reorderable
                            </Badge>
                          )}
                          
                          {blockMetadata?.aiSummary && (
                            <Badge variant="outline" style={{ fontSize: '0.75rem' }}>
                              🧠 AI
                            </Badge>
                          )}
                          
                          {blockMetadata?.extractedTo && (
                            <Badge variant="outline" style={{ fontSize: '0.75rem' }}>
                              📤 Extracted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {renderOptions.showActions && (
                      <div className="block-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                        <Tooltip content="Extract to new note">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockAction('extract', block);
                            }}
                          >
                            <Icon name="external-link" size={14} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Summarize with AI">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockAction('summarize', block);
                            }}
                          >
                            <Icon name="brain" size={14} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Delete block">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockAction('delete', block);
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </Button>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* Block Content */}
                  <div className="block-content" style={{ 
                    color: theme.colors.text,
                    lineHeight: '1.5',
                    marginBottom: '0.5rem'
                  }}>
                    {block.content.length > 200 
                      ? block.content.substring(0, 200) + '...'
                      : block.content
                    }
                  </div>

                  {/* Block Tags */}
                  {renderOptions.showTags && block.tags.length > 0 && (
                    <div className="block-tags" style={{ 
                      display: 'flex',
                      gap: '0.25rem',
                      flexWrap: 'wrap',
                      marginTop: '0.5rem'
                    }}>
                      {block.tags.map(tag => (
                        <Badge key={tag} variant="secondary" style={{ fontSize: '0.75rem' }}>
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* AI Summary */}
                  {renderOptions.showMetadata && blockMetadata?.aiSummary && (
                    <div className="block-ai-summary" style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: theme.colors.primary + '10',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      color: theme.colors.textSecondary
                    }}>
                      <strong>AI Summary:</strong> {blockMetadata.aiSummary}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* AI Actions */}
      <div className="smart-blocks-ai-actions" style={{ 
        padding: '1rem',
        borderTop: `1px solid ${theme.colors.border}`,
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        <Button
          variant="outline"
          onClick={handleReorderSuggestions}
          disabled={blocks.filter(b => b.reorderable).length < 2}
          style={{ borderColor: theme.colors.border }}
        >
          <Icon name="move" size={16} />
          Suggest Reorder
        </Button>
        
        <Button
          variant="outline"
          onClick={handleBatchProcess}
          disabled={blocks.length === 0}
          style={{ borderColor: theme.colors.border }}
        >
          <Icon name="zap" size={16} />
          Batch Process
        </Button>
      </div>

      {/* Create Block Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Smart Block"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
              Content:
            </label>
            <textarea
              value={newBlockContent}
              onChange={(e) => setNewBlockContent(e.target.value)}
              placeholder="Enter block content..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.5rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
                Type:
              </label>
              <Select
                value={newBlockOptions.type}
                onChange={(value) => setNewBlockOptions(prev => ({ ...prev, type: value as BlockType }))}
              >
                {['summary', 'zettel', 'quote', 'argument', 'definition', 'example', 'question', 'insight', 'todo', 'note'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
                Title:
              </label>
              <Input
                value={newBlockOptions.title || ''}
                onChange={(e) => setNewBlockOptions(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Optional title"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
              Tags:
            </label>
            <Input
              value={newBlockOptions.tags?.join(', ') || ''}
              onChange={(e) => setNewBlockOptions(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <Checkbox
              checked={newBlockOptions.reorderable || false}
              onChange={(checked) => setNewBlockOptions(prev => ({ ...prev, reorderable: checked }))}
              label="Reorderable"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlock} disabled={!newBlockContent.trim()}>
              Create Block
            </Button>
          </div>
        </div>
      </Modal>

      {/* Extract Block Modal */}
      <Modal
        isOpen={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        title="Extract Block to New Note"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedBlockForAction && (
            <div style={{ 
              padding: '1rem',
              backgroundColor: theme.colors.surface,
              borderRadius: '4px',
              border: `1px solid ${theme.colors.border}`
            }}>
              <strong>Block to extract:</strong>
              <div style={{ marginTop: '0.5rem', color: theme.colors.textSecondary }}>
                {selectedBlockForAction.content.substring(0, 100)}...
              </div>
            </div>
          )}

          <div>
            <Checkbox
              checked={extractOptions.createBacklink || false}
              onChange={(checked) => setExtractOptions(prev => ({ ...prev, createBacklink: checked }))}
              label="Create backlink to original note"
            />
          </div>

          <div>
            <Checkbox
              checked={extractOptions.inheritTags || false}
              onChange={(checked) => setExtractOptions(prev => ({ ...prev, inheritTags: checked }))}
              label="Inherit tags from block"
            />
          </div>

          <div>
            <Checkbox
              checked={extractOptions.addSourceReference || false}
              onChange={(checked) => setExtractOptions(prev => ({ ...prev, addSourceReference: checked }))}
              label="Add source reference"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowExtractModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtractBlock}>
              Extract Block
            </Button>
          </div>
        </div>
      </Modal>

      {/* Summarize Block Modal */}
      <Modal
        isOpen={showSummarizeModal}
        onClose={() => setShowSummarizeModal(false)}
        title="Summarize Block with AI"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedBlockForAction && (
            <div style={{ 
              padding: '1rem',
              backgroundColor: theme.colors.surface,
              borderRadius: '4px',
              border: `1px solid ${theme.colors.border}`
            }}>
              <strong>Block to summarize:</strong>
              <div style={{ marginTop: '0.5rem', color: theme.colors.textSecondary }}>
                {selectedBlockForAction.content.substring(0, 100)}...
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
                Model:
              </label>
              <Select
                value={summarizeOptions.model}
                onChange={(value) => setSummarizeOptions(prev => ({ ...prev, model: value as any }))}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude">Claude</option>
                <option value="local">Local</option>
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
                Style:
              </label>
              <Select
                value={summarizeOptions.style}
                onChange={(value) => setSummarizeOptions(prev => ({ ...prev, style: value as any }))}
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="bullet-points">Bullet Points</option>
              </Select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.text }}>
              Max Length:
            </label>
            <Input
              type="number"
              value={summarizeOptions.maxLength}
              onChange={(e) => setSummarizeOptions(prev => ({ ...prev, maxLength: parseInt(e.target.value) }))}
              min={50}
              max={500}
            />
          </div>

          <div>
            <Checkbox
              checked={summarizeOptions.includeContext || false}
              onChange={(checked) => setSummarizeOptions(prev => ({ ...prev, includeContext: checked }))}
              label="Include context from surrounding blocks"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowSummarizeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSummarizeBlock}>
              Summarize
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 