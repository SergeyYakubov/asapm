it('works', () => {
    cy.visit('http://localhost:3000')
    cy.wrap('foo').should('equal', 'foo')
})
