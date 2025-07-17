describe('Create, edit, and link notes', () => {
  it('should create two notes, link them, and navigate via the link', () => {
    // Visit app
    cy.visit('/');

    // Create first note
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('First Note');
    cy.get('[data-cy=markdown-editor]').type('This is the first note.');
    cy.get('[data-cy=save-note-btn]').click();

    // Create second note
    cy.get('[data-cy=new-note-btn]').click();
    cy.get('[data-cy=note-title-input]').type('Second Note');
    cy.get('[data-cy=markdown-editor]').type('This note links to [[First Note]].');
    cy.get('[data-cy=save-note-btn]').click();

    // Open second note and click the internal link
    cy.contains('Second Note').click();
    cy.get('[data-cy=markdown-preview]').contains('[[First Note]]').click();

    // Verify navigation to first note
    cy.get('[data-cy=note-title-input]').should('have.value', 'First Note');
    cy.get('[data-cy=markdown-editor]').should('contain.value', 'This is the first note.');
  });
}); 