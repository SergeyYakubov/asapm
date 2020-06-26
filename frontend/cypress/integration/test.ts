let endpoint = Cypress.env('FRONTEND_URL') || 'http://localhost/default/asapm'

it('works', () => {
    cy.visit(endpoint)
    cy.title().should('eq', 'React App')
})
