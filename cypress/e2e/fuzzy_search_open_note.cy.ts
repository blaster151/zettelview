describe('Fuzzy search and open note', () => {
  it('should find a note with fuzzy search and open it', () => {
    // Visit app
    cy.visit('/');

    // Create a note with a unique title
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('Quantum Entanglement');
    cy.get('[data-cy=markdown-editor]').type('Spooky action at a distance.');
    cy.get('[data-cy=save-note-btn]').click();

    // Use fuzzy search with a typo
    cy.get('[data-cy=search-input]').type('Quantm Entanglment');
    cy.get('[data-cy=search-suggestion]').contains('Quantum Entanglement').click();

    // Verify the note is opened
    cy.get('[data-cy=note-title-input]').should('have.value', 'Quantum Entanglement');
    cy.get('[data-cy=markdown-editor]').should('contain.value', 'Spooky action at a distance.');
  });
}); 