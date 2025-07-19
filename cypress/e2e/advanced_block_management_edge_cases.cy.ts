describe('Advanced Block Management - Edge Cases', () => {
  beforeEach(() => {
    // Visit app and set up test data with edge cases
    cy.visit('/');
    
    // Create a test note with edge case blocks
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('Edge Cases Test');
    cy.get('[data-cy=markdown-editor]').type(`
<!-- @block id=empty-block type=note tags="" aiGenerated=false confidence=0.0 -->
<!-- @block id=very-long-content type=summary tags="long,content" aiGenerated=true confidence=1.0 -->
This is a very long content block that contains a lot of text to test how the system handles blocks with extensive content. It includes multiple sentences and paragraphs to simulate real-world usage scenarios where users might have very detailed notes with lots of information that needs to be processed and managed effectively.

<!-- @block id=special-chars type=extract tags="special,chars,test" aiGenerated=false confidence=0.5 -->
Content with special characters: !@#$%^&*()_+-=[]{}|;':",./<>? and emojis 🚀📚💡

<!-- @block id=unicode-block type=note tags="unicode,test" aiGenerated=true confidence=0.75 -->
Unicode content: αβγδε ζηθικλμν ξοπρστ υφχψω

<!-- @block id=duplicate-tags type=summary tags="duplicate,duplicate,duplicate" aiGenerated=false confidence=0.6 -->
Block with duplicate tags.

<!-- @block id=very-high-confidence type=note tags="confidence" aiGenerated=true confidence=0.999 -->
Block with very high confidence score.

<!-- @block id=very-low-confidence type=extract tags="confidence" aiGenerated=false confidence=0.001 -->
Block with very low confidence score.
    `);
    cy.get('[data-cy=save-note-btn]').click();
    
    // Open Smart Blocks panel
    cy.get('[data-cy=smart-blocks-btn]').click();
  });

  describe('Edge Case Filtering', () => {
    it('should handle empty blocks in filtering', () => {
      // Filter by empty content
      cy.get('[data-cy=filter-content-length]').type('0');
      cy.get('[data-cy=apply-content-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'empty-block');
      cy.get('[data-cy=block-list]').should('not.contain', 'very-long-content');
      
      // Clear filter
      cy.get('[data-cy=clear-content-filter]').click();
    });

    it('should handle blocks with special characters in tags', () => {
      // Filter by special characters tag
      cy.get('[data-cy=filter-tags-input]').type('special');
      cy.get('[data-cy=apply-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'special-chars');
      cy.get('[data-cy=block-list]').should('not.contain', 'empty-block');
      
      // Clear filter
      cy.get('[data-cy=clear-tag-filter]').click();
    });

    it('should handle unicode content in filtering', () => {
      // Filter by unicode tag
      cy.get('[data-cy=filter-tags-input]').type('unicode');
      cy.get('[data-cy=apply-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'unicode-block');
      
      // Clear filter
      cy.get('[data-cy=clear-tag-filter]').click();
    });

    it('should handle duplicate tags gracefully', () => {
      // Filter by duplicate tag
      cy.get('[data-cy=filter-tags-input]').type('duplicate');
      cy.get('[data-cy=apply-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'duplicate-tags');
      
      // Verify tag display shows unique tags only
      cy.get('[data-cy=block-item]').contains('duplicate-tags').click();
      cy.get('[data-cy=block-tags-display]').should('contain', 'duplicate');
      // Should not show duplicate tags multiple times
      cy.get('[data-cy=block-tags-display]').should('not.contain', 'duplicate,duplicate,duplicate');
      
      // Clear filter
      cy.get('[data-cy=clear-tag-filter]').click();
    });

    it('should handle extreme confidence values', () => {
      // Filter by very high confidence
      cy.get('[data-cy=filter-confidence-min]').type('0.99');
      cy.get('[data-cy=apply-confidence-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'very-high-confidence');
      cy.get('[data-cy=block-list]').should('not.contain', 'very-low-confidence');
      
      // Filter by very low confidence
      cy.get('[data-cy=filter-confidence-max]').type('0.01');
      cy.get('[data-cy=apply-confidence-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'very-low-confidence');
      cy.get('[data-cy=block-list]').should('not.contain', 'very-high-confidence');
      
      // Clear filter
      cy.get('[data-cy=clear-confidence-filter]').click();
    });
  });

  describe('Edge Case Sorting', () => {
    it('should handle sorting with empty content', () => {
      // Sort by content length (shortest first)
      cy.get('[data-cy=sort-field-select]').select('contentLength');
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Empty block should come first
      cy.get('[data-cy=block-list]').first().should('contain', 'empty-block');
      
      // Sort by content length (longest first)
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Long content block should come first
      cy.get('[data-cy=block-list]').first().should('contain', 'very-long-content');
    });

    it('should handle sorting with extreme confidence values', () => {
      // Sort by confidence (highest first)
      cy.get('[data-cy=sort-field-select]').select('confidence');
      cy.get('[data-cy=sort-direction-select]').select('desc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Very high confidence should come first
      cy.get('[data-cy=block-list]').first().should('contain', 'very-high-confidence');
      
      // Sort by confidence (lowest first)
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Very low confidence should come first
      cy.get('[data-cy=block-list]').first().should('contain', 'very-low-confidence');
    });

    it('should handle sorting with unicode content', () => {
      // Sort by content alphabetically
      cy.get('[data-cy=sort-field-select]').select('content');
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Unicode content should be handled properly
      cy.get('[data-cy=block-list]').should('contain', 'unicode-block');
    });
  });

  describe('Edge Case Batch Operations', () => {
    it('should handle batch operations on empty blocks', () => {
      // Select empty block
      cy.get('[data-cy=block-checkbox]').eq(0).check(); // empty-block
      
      // Try to summarize empty block
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle gracefully
      cy.get('[data-cy=batch-results]').should('contain', '1 operations successful');
      cy.get('[data-cy=batch-results]').should('contain', '0 operations failed');
    });

    it('should handle batch operations on very long content', () => {
      // Select very long content block
      cy.get('[data-cy=block-checkbox]').eq(1).check(); // very-long-content
      
      // Try to process very long content
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-embed]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle gracefully
      cy.get('[data-cy=batch-results]').should('contain', '1 operations successful');
    });

    it('should handle batch operations with special characters', () => {
      // Select block with special characters
      cy.get('[data-cy=block-checkbox]').eq(2).check(); // special-chars
      
      // Try to process content with special characters
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-update-metadata]').click();
      cy.get('[data-cy=batch-metadata-category]').type('special-category!@#');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle special characters gracefully
      cy.get('[data-cy=batch-results]').should('contain', '1 operations successful');
    });

    it('should handle batch operations on unicode content', () => {
      // Select unicode block
      cy.get('[data-cy=block-checkbox]').eq(3).check(); // unicode-block
      
      // Try to process unicode content
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle unicode gracefully
      cy.get('[data-cy=batch-results]').should('contain', '1 operations successful');
    });

    it('should handle batch operations with duplicate tags', () => {
      // Select block with duplicate tags
      cy.get('[data-cy=block-checkbox]').eq(4).check(); // duplicate-tags
      
      // Try to add more tags
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-tag-operations]').click();
      cy.get('[data-cy=batch-add-tag]').type('duplicate');
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle duplicate tags gracefully
      cy.get('[data-cy=batch-results]').should('contain', '1 operations successful');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle large numbers of blocks efficiently', () => {
      // Create many blocks programmatically
      let markdownContent = '';
      for (let i = 1; i <= 100; i++) {
        markdownContent += `<!-- @block id=perf-block-${i} type=note tags="performance,test" aiGenerated=false confidence=0.5 -->\nBlock ${i} content.\n\n`;
      }
      
      // Create new note with many blocks
      cy.get('[data-cy=new-note-btn]').click();
      cy.get('[data-cy=note-title-input]').type('Performance Test');
      cy.get('[data-cy=markdown-editor]').type(markdownContent);
      cy.get('[data-cy=save-note-btn]').click();
      
      // Open Smart Blocks panel
      cy.get('[data-cy=smart-blocks-btn]').click();
      
      // Apply filtering - should be responsive
      cy.get('[data-cy=filter-type-select]').select('note');
      cy.get('[data-cy=block-list]').should('contain', 'perf-block-1');
      cy.get('[data-cy=block-list]').should('contain', 'perf-block-100');
      
      // Apply sorting - should be responsive
      cy.get('[data-cy=sort-field-select]').select('id');
      cy.get('[data-cy=sort-direction-select]').select('asc');
      cy.get('[data-cy=apply-sort]').click();
      
      // Select all blocks for batch operation
      cy.get('[data-cy=select-all-blocks]').click();
      cy.get('[data-cy=selected-count]').should('contain', '100 blocks selected');
      
      // Batch operation should be responsive
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should complete without timeout
      cy.get('[data-cy=batch-results]', { timeout: 30000 }).should('contain', '100 operations successful');
    });

    it('should handle rapid filter changes', () => {
      // Rapidly change filters
      cy.get('[data-cy=filter-type-select]').select('note');
      cy.get('[data-cy=filter-type-select]').select('summary');
      cy.get('[data-cy=filter-type-select]').select('extract');
      cy.get('[data-cy=filter-type-select]').select('all');
      
      // Should not crash or show errors
      cy.get('[data-cy=block-list]').should('be.visible');
      cy.get('[data-cy=error-message]').should('not.exist');
    });

    it('should handle rapid sort changes', () => {
      // Rapidly change sorting
      cy.get('[data-cy=sort-field-select]').select('priority');
      cy.get('[data-cy=apply-sort]').click();
      cy.get('[data-cy=sort-field-select]').select('confidence');
      cy.get('[data-cy=apply-sort]').click();
      cy.get('[data-cy=sort-field-select]').select('createdAt');
      cy.get('[data-cy=apply-sort]').click();
      
      // Should not crash or show errors
      cy.get('[data-cy=block-list]').should('be.visible');
      cy.get('[data-cy=error-message]').should('not.exist');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors during batch operations', () => {
      // Select a block
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      
      // Mock network error
      cy.intercept('POST', '/api/ai/summarize', { statusCode: 500, body: { error: 'Network error' } });
      
      // Try batch operation
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Should handle error gracefully
      cy.get('[data-cy=batch-results]').should('contain', '0 operations successful');
      cy.get('[data-cy=batch-results]').should('contain', '1 operations failed');
      cy.get('[data-cy=batch-error-details]').should('contain', 'Network error');
    });

    it('should handle invalid filter inputs', () => {
      // Try invalid confidence filter
      cy.get('[data-cy=filter-confidence-min]').type('invalid');
      cy.get('[data-cy=apply-confidence-filter]').click();
      
      // Should show validation error
      cy.get('[data-cy=filter-error]').should('contain', 'Invalid confidence value');
      
      // Try invalid content length filter
      cy.get('[data-cy=filter-content-length]').type('-1');
      cy.get('[data-cy=apply-content-filter]').click();
      
      // Should show validation error
      cy.get('[data-cy=filter-error]').should('contain', 'Invalid content length');
    });

    it('should handle empty filter results', () => {
      // Apply filter that matches no blocks
      cy.get('[data-cy=filter-tags-input]').type('nonexistent-tag');
      cy.get('[data-cy=apply-tag-filter]').click();
      
      // Should show empty state
      cy.get('[data-cy=empty-filter-results]').should('be.visible');
      cy.get('[data-cy=empty-filter-results]').should('contain', 'No blocks match your filters');
      
      // Clear filter should restore blocks
      cy.get('[data-cy=clear-tag-filter]').click();
      cy.get('[data-cy=block-list]').should('contain', 'empty-block');
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('should handle keyboard navigation for filtering', () => {
      // Navigate to filter controls with keyboard
      cy.get('body').tab();
      cy.get('[data-cy=filter-type-select]').should('be.focused');
      
      // Use keyboard to change filter
      cy.get('[data-cy=filter-type-select]').type('{downArrow}');
      cy.get('[data-cy=filter-type-select]').should('have.value', 'note');
      
      // Navigate to next filter control
      cy.get('[data-cy=filter-type-select]').tab();
      cy.get('[data-cy=filter-priority-select]').should('be.focused');
    });

    it('should handle screen reader announcements for batch operations', () => {
      // Select blocks
      cy.get('[data-cy=block-checkbox]').eq(0).check();
      cy.get('[data-cy=block-checkbox]').eq(1).check();
      
      // Verify screen reader announcement
      cy.get('[data-cy=screen-reader-announcement]').should('contain', '2 blocks selected');
      
      // Perform batch operation
      cy.get('[data-cy=batch-operations-btn]').click();
      cy.get('[data-cy=batch-summarize]').click();
      cy.get('[data-cy=execute-batch-operation]').click();
      
      // Verify completion announcement
      cy.get('[data-cy=screen-reader-announcement]').should('contain', 'Batch operation completed');
    });
  });
}); 