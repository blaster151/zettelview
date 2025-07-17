describe('Zen mode and ephemeral connection capture', () => {
  it('should enter Zen mode, type, capture a connection, and verify new note', () => {
    // Visit app
    cy.visit('/');

    // Create a new note and enter Zen mode
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('Zen Test Note');
    cy.get('[data-cy=markdown-editor]').type('Writing about neural networks.');
    cy.get('[data-cy=zen-mode-btn]').click();

    // Type more content in Zen mode
    cy.get('[data-cy=zen-editor]').type(' Deep learning is fascinating.');

    // Wait for ephemeral connection to appear
    cy.get('[data-cy=ephemeral-connection-card]').first().should('be.visible');

    // Capture the connection as a new note
    cy.get('[data-cy=ephemeral-connection-card] [data-cy=capture-btn]').first().click();

    // Exit Zen mode
    cy.get('[data-cy=zen-exit-btn]').click();

    // Verify the new note exists and is linked
    cy.get('[data-cy=note-list]').contains('Deep learning').click();
    cy.get('[data-cy=markdown-editor]').should('contain.value', 'Deep learning');
    cy.get('[data-cy=markdown-editor]').should('contain.value', '[[Zen Test Note]]');
  });
}); 