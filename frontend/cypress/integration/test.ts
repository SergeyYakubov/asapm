import "cypress-keycloak-commands";

let endpoint = Cypress.env('FRONTEND_URL') || 'http://localhost/default/asapm'

describe("Keycloak Login", () => {
    beforeEach(() => {
        cy.kcLogout();
        cy.kcLogin("asapm");
        cy.visit(endpoint);
    });

    it("should set user name", () => {
        cy.get('#username').should('have.text', 'Test User')
    });
});
