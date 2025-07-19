describe('Advanced Block Management', () => {
  beforeEach(() => {
    // Visit app and set up test data
    cy.visit('/');
    
    // Create a test note with multiple smart blocks
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('Advanced Block Management Test');
    cy.get('[data-cy=markdown-editor]').type(`
<!-- @block id=block-1 type=note tags="priority:high,status:active,category:research" aiGenerated=false confidence=0.9 -->
High priority research note about machine learning algorithms.

<!-- @block id=block-2 type=summary tags="priority:medium,status:draft,category:learning" aiGenerated=true confidence=0.8 -->
Medium priority summary of neural network concepts.

<!-- @block id=block-3 type=extract tags="priority:low,status:archived,category:reference" aiGenerated=false confidence=0.7 -->
Low priority extract from research paper.

<!-- @block id=block-4 type=note tags="priority:high,status:active,category:research" aiGenerated=true confidence=0.95 -->
Another high priority research note about deep learning.

<!-- @block id=block-5 type=summary tags="priority:medium,status:draft,category:learning" aiGenerated=false confidence=0.6 -->
Medium priority summary about data preprocessing.
    `);
    cy.get('[data-cy=save-note-btn]').click();
    
    // Open Smart Blocks panel
    cy.get('[data-cy=smart-blocks-btn]').click();
  });

  describe('Block Filtering', () => {
    it('should filter blocks by type', () => {
      // Filter by note type
      cy.get('[data-cy=filter-type-select]').select('note');
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5');
      
      // Filter by summary type
      cy.get('[data-cy=filter-type-select]').select('summary');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
      
      // Filter by extract type
      cy.get('[data-cy=filter-type-select]').select('extract');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2');
      
      // Clear filter
      cy.get('[data-cy=filter-type-select]').select('all');
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
    });

    it('should filter blocks by priority', () => {
      // Filter by high priority
      cy.get('[data-cy=filter-priority-select]').select('high');
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5');
      
      // Filter by medium priority
      cy.get('[data-cy=filter-priority-select]').select('medium');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
      
      // Filter by low priority
      cy.get('[data-cy=filter-priority-select]').select('low');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2');
    });

    it('should filter blocks by AI generation status', () => {
      // Filter by AI-generated blocks
      cy.get('[data-cy=filter-ai-generated]').check();
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5');
      
      // Uncheck to show all blocks
      cy.get('[data-cy=filter-ai-generated]').uncheck();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
    });

    it('should filter blocks by tags', () => {
      // Filter by research tag
      cy.get('[data-cy=filter-tags-input]').type('research');
      cy.get('[data-cy=apply-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5');
      
      // Clear tag filter
      cy.get('[data-cy=clear-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
    });

    it('should filter blocks by confidence range', () => {
      // Set minimum confidence to 0.8
      cy.get('[data-cy=filter-confidence-min]').type('0.8');
      cy.get('[data-cy=apply-confidence-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5');
      
      // Clear confidence filter
      cy.get('[data-cy=clear-confidence-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
    });

    it('should combine multiple filters', () => {
      // Apply multiple filters
      cy.get('[data-cy=filter-type-select]').select('note');
      cy.get('[data-cy=filter-priority-select]').select('high');
      cy.get('[data-cy=filter-ai-generated]').check();
      
      // Should only show high priority, AI-generated notes
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1'); // Not AI-generated
      cy.get('[data-cy=block-list]').should('not.contain', 'block-2'); // Not note type
      cy.get('[data-cy=block-list]').should('not.contain', 'block-3'); // Not note type
      cy.get('[data-cy=block-list]').should('not.contain', 'block-5'); // Not note type
      
      // Clear all filters
      cy.get('[data-cy=clear-all-filters]').click();
      cy.get('[data-cy=block-list]').should('contain', 'block-1');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-3');
      cy.get('[data-cy=block-list]').should('contain', 'block-4');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
    });
  });

  describe('Block Sorting', () => {
    it('should sort blocks by priority', () => {
      // Sort by priority (high to low)
      cy.get('[data-cy=sort-field-select]').select('priority');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify high priority blocks come first
      cy.get('[data-cy=block-list]').first().should('contain', 'block-1');
      cy.get('[data-cy=block-list]').eq(1).should('contain', 'block-4');
      
      // Sort by priority (low to high)
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify low priority blocks come first
      cy.get('[data-cy=block-list]').first().should('contain', 'block-3');
    });

    it('should sort blocks by confidence', () => {
      // Sort by confidence (high to low)
      cy.get('[data-cy=sort-field-select]').select('confidence');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify highest confidence block comes first
      cy.get('[data-cy=block-list]').first().should('contain', 'block-4'); // 0.95
      cy.get('[data-cy=block-list]').eq(1).should('contain', 'block-1'); // 0.9
      cy.get('[data-cy=block-list]').eq(2).should('contain', 'block-2'); // 0.8
    });

    it('should sort blocks by creation date', () => {
      // Sort by creation date (newest first)
      cy.get('[data-cy=sort-field-select]').select('createdAt');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify blocks are sorted by creation order (last created first)
      cy.get('[data-cy=block-list]').first().should('contain', 'block-5');
      cy.get('[data-cy=block-list]').eq(1).should('contain', 'block-4');
      cy.get('[data-cy=block-list]').eq(2).should('contain', 'block-3');
    });

    it('should sort blocks by type', () => {
      // Sort by type alphabetically
      cy.get('[data-cy=sort-field-select]').select('type');
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify blocks are sorted by type (extract, note, summary)
      cy.get('[data-cy=block-list]').first().should('contain', 'block-3'); // extract
      cy.get('[data-cy=block-list]').eq(1).should('contain', 'block-1'); // note
      cy.get('[data-cy=block-list]').eq(2).should('contain', 'block-4'); // note
      cy.get('[data-cy=block-list]').eq(3).should('contain', 'block-2'); // summary
      cy.get('[data-cy=block-list]').eq(4).should('contain', 'block-5'); // summary
    });

    it('should sort blocks by content length', () => {
      // Sort by content length (longest first)
      cy.get('[data-cy=sort-field-select]').select('contentLength');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Verify longer content blocks come first
      cy.get('[data-cy=block-list]').first().should('contain', 'block-1'); // Longest content
      cy.get('[data-cy=block-list]').eq(1).should('contain', 'block-4'); // Second longest
    });
  });

  describe('Batch Operations', () => {
    it('should select multiple blocks for batch operations', () => {
      // Select first two blocks
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      cy.get('[data-cy=block-checkbox]').eq(1).check();
      
      // Verify selection count
      cy.get('[data-cy=selected-count]').should('contain', '2 blocks selected');
      
      // Select all blocks
      cy.get('[data-cy=select-all-blocks]').click();
      cy.get('[data-cy=selected-count]').should('contain', '5 blocks selected');
      
      // Deselect all
      cy.get('[data-cy=deselect-all-blocks]').click();
      cy.get('[data-cy=selected-count]').should('contain', '0 blocks selected');
    });

    it('should perform batch summarization', () => {
      // Select all blocks
      cy.get('[data-cy=select-all-blocks]').click();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select summarization operation
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify batch processing
      cy.get('[data-cy=batch-progress]').should('be.visible');
      cy.get('[data-cy=batch-results]').should('contain', '5 operations successful');
      cy.get('[data-cy=batch-results]').should('contain', '0 operations failed');
      
      // Verify summaries were generated
      cy.get('[data-cy=block-item]').first().click();
      cy.get('[data-cy=block-summary]').should('be.visible');
      cy.get('[data-cy=block-summary]').should('not.be.empty');
    });

    it('should perform batch embedding generation', () => {
      // Select first three blocks
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      cy.get('[data-cy=block-checkbox]').eq(1).check();
      cy.get('[data-cy=block-checkbox]').eq(2).check();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select embedding generation
      cy.get('[data-cy=batch-embed]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify batch processing
      cy.get('[data-cy=batch-results]').should('contain', '3 operations successful');
      
      // Verify embeddings were generated
      cy.get('[data-cy=block-item]').first().click();
      cy.get('[data-cy=block-embedding]').should('be.visible');
    });

    it('should perform batch metadata update', () => {
      // Select all blocks
      cy.get('[data-cy=select-all-blocks]').click();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select metadata update
      cy.get('[data-cy=batch-update-metadata]').click();
      
      // Set new metadata values
      cy.get('[data-cy=batch-metadata-status]').select('active');
      cy.get('[data-cy=batch-metadata-category]').type('batch-processed');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify batch processing
      cy.get('[data-cy=batch-results]').should('contain', '5 operations successful');
      
      // Verify metadata was updated
      cy.get('[data-cy=block-item]').first().click();
      cy.get('[data-cy=block-status]').should('contain', 'active');
      cy.get('[data-cy=block-category]').should('contain', 'batch-processed');
    });

    it('should perform batch tag operations', () => {
      // Select first two blocks
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      cy.get('[data-cy=block-checkbox]').eq(1).check();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select tag operations
      cy.get('[data-cy=batch-tag-operations]').click();
      
      // Add new tag
      cy.get('[data-cy=batch-add-tag]').type('batch-tested');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify batch processing
      cy.get('[data-cy=batch-results]').should('contain', '2 operations successful');
      
      // Verify tags were added
      cy.get('[data-cy=block-item]').first().click();
      cy.get('[data-cy=block-tags]').should('contain', 'batch-tested');
    });

    it('should perform batch export', () => {
      // Select all blocks
      cy.get('[data-cy=select-all-blocks]').click();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select export operation
      cy.get('[data-cy=batch-export]').click();
      cy.get('[data-cy=export-format]').select('json');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify export file was created
      cy.readFile('cypress/downloads/blocks_export.json').then((content) => {
        expect(content).to.have.property('blocks');
        expect(content.blocks).to.have.length(5);
        expect(content.blocks[0]).to.have.property('id', 'block-1');
        expect(content.blocks[1]).to.have.property('id', 'block-2');
        expect(content.blocks[2]).to.have.property('id', 'block-3');
        expect(content.blocks[3]).to.have.property('id', 'block-4');
        expect(content.blocks[4]).to.have.property('id', 'block-5');
      });
    });

    it('should handle batch operation errors gracefully', () => {
      // Mock a failed operation by selecting invalid blocks
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      
      // Open batch operations menu
      cy.get('[data-cy=batch-operations-btn]').click();
      
      // Select an operation that might fail
      cy.get('[data-cy=batch-summarize]').click();
      
      // Mock API failure
      cy.intercept('POST', '/api/ai/summarize', { statusCode: 500, body: { error: 'AI service unavailable' } });
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify error handling
      cy.get('[data-cy=batch-results]').should('contain', '0 operations successful');
      cy.get('[data-cy=batch-results]').should('contain', '1 operations failed');
      cy.get('[data-cy=batch-error-details]').should('contain', 'AI service unavailable');
    });
  });

  describe('Advanced Filtering and Sorting Combinations', () => {
    it('should combine filtering and sorting with batch operations', () => {
      // Apply filters
      cy.get('[data-cy=filter-type-select]').select('note');
      cy.get('[data-cy=filter-priority-select]').select('high');
      
      // Apply sorting
      cy.get('[data-cy=sort-field-select]').select('confidence');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Select filtered and sorted blocks
      cy.get('[data-cy=select-all-visible]').click();
      cy.get('[data-cy=selected-count]').should('contain', '2 blocks selected');
      
      // Perform batch operation on filtered results
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify operation was performed on filtered blocks only
      cy.get('[data-cy=batch-results]').should('contain', '2 operations successful');
    });

    it('should maintain filter and sort state during batch operations', () => {
      // Apply filters and sorting
      cy.get('[data-cy=filter-type-select]').select('summary');
      cy.get('[data-cy=sort-field-select]').select('priority');
      cy.get('[data-cy=apply-sort]').click();
      
      // Perform batch operation
      cy.get('[data-cy=select-all-visible]').click();
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-update-metadata]').click();
      cy.get('[data-cy=batch-metadata-status]').select('active');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify filters and sorting are still applied
      cy.get('[data-cy=filter-type-select]').should('have.value', 'summary');
      cy.get('[data-cy=sort-field-select]').should('have.value', 'priority');
      cy.get('[data-cy=block-list]').should('contain', 'block-2');
      cy.get('[data-cy=block-list]').should('contain', 'block-5');
      cy.get('[data-cy=block-list]').should('not.contain', 'block-1');
    });
  });
}); 