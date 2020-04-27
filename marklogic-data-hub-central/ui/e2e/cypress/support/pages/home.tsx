class HomePage{

    getViewEntities() {
        return cy.contains('View Entities');
    }

    getBrowseEntities() {
        return cy.contains('Browse Entities');
    }

    // temporary change as tile is not working
    getTitle() {
        return cy.contains('MarkLogic Data Hub');
    }

    getModeling() {
      return cy.contains('Modeling');
  }
    getEntitiesTile() {
        return cy.get('button[aria-label="Entity"]');
    }
}

export default HomePage;
