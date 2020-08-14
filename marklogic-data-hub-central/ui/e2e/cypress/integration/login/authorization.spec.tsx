/// <reference types="cypress"/>

import loginPage from '../../support/pages/login';
import { Application } from '../../support/application.config';
import { toolbar, tiles, projectInfo } from '../../support/components/common/index';
import 'cypress-wait-until';
import loadPage from "../../support/pages/load";
import modelPage from "../../support/pages/model";
import runPage from "../../support/pages/run";
import curatePage from "../../support/pages/curate";

describe('login', () => {

  before(() => {
    cy.visit('/');
  });

  afterEach(() => {
      cy.logout();
  });

  after(() => {
    //resetting the test user back to only have 'hub-central-user' role
    cy.resetTestUser();
  });

  it('greets with Data Hub Central title and footer links', () => {
      cy.contains(Application.title);
      cy.contains('Privacy');
  });

  it('should verify all the error conditions for login', () => {
      //Verify username/password is required and login button is disabled
      loginPage.getUsername().type('{enter}').blur();
      loginPage.getPassword().type('{enter}').blur();
      cy.contains('Username is required');
      cy.contains('Password is required');
      loginPage.getLoginButton().should('be.disabled');

      //Verify invalid credentials error message
      loginPage.getUsername().type('test');
      loginPage.getPassword().type('password');
      loginPage.getLoginButton().click();
      cy.contains('The username and password combination is not recognized by MarkLogic.');

      //Verify admin cannot login
      loginPage.getUsername().clear();
      loginPage.getPassword().clear();
      cy.fixture('users/admin').then(user => {
          loginPage.getUsername().type(user['user-name']);
          loginPage.getPassword().type(user.password);
      });
      loginPage.getLoginButton().click();
      cy.contains('User does not have the required permissions to run Data Hub.');

  });

  it('should only enable Explorer tile for hub-central-user', () => {
      cy.loginAsTestUserWithRoles('hub-central-saved-query-user').withUI()
          .url().should('include', '/tiles');
        //All tiles but Explore, should show a tooltip that says contact your administrator
      ['Load', 'Model', 'Curate', 'Run'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
      });

      toolbar.getExploreToolbarIcon().trigger('mouseover');
      cy.contains('Explore');
      toolbar.getExploreToolbarIcon().click();
      cy.findByText('Search through loaded data and curated data');
      tiles.getExploreTile().should('exist');
      projectInfo.getAboutProject().click();
      projectInfo.waitForInfoPageToLoad();
      projectInfo.getDownloadButton().should('be.disabled');
      projectInfo.getClearButton().should('be.disabled');
  });

  it('should only enable Model and Explorer tile for hub-central-entity-model-reader', () => {
      cy.loginAsTestUserWithRoles('hub-central-entity-model-reader', 'hub-central-saved-query-user').withUI()
          .url().should('include', '/tile');
      //All tiles but Explore and Model, should show a tooltip that says contact your administrator
      ['Load', 'Curate', 'Run'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
      });

      toolbar.getModelToolbarIcon().click();
      tiles.getModelTile().should('exist');
      modelPage.getAddEntityButton().should('be.disabled');
  });

  it('should only enable Load and Explorer tile for hub-central-load-reader', () => {
      let stepName = 'loadCustomersJSON';
      let flowName= 'personJSON'
      cy.loginAsTestUserWithRoles('hub-central-load-reader').withRequest()
          .url().should('include', '/tile');
      //All tiles but Explore and Model, should show a tooltip that says contact your administrator
      ['Model', 'Curate', 'Run'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
      });

      toolbar.getLoadToolbarIcon().click();
      loadPage.loadView('th-large').should('be.visible');
      loadPage.addNewButton('card').should('not.be.visible');
      loadPage.stepSettings(stepName).click();
      loadPage.stepNameInSettings().should('have.text', stepName);
      loadPage.saveSettings(stepName).should('be.disabled');
      loadPage.cancelSettings(stepName).click();
      loadPage.editStepInCardView(stepName).click();
      loadPage.saveButton().should('be.disabled');
      loadPage.cancelButton().click();
      loadPage.deleteStepDisabled(stepName).should('exist');
      loadPage.stepName(stepName).trigger('mouseover');
      loadPage.addToNewFlow(stepName).click();
      runPage.newFlowModal().should('not.be.visible');
      loadPage.existingFlowsList(stepName).click();
      loadPage.existingFlowsList(flowName).should('not.be.visible');

      loadPage.loadView('table').click();
      tiles.waitForTableToLoad();
      loadPage.addToFlowDisabled(stepName).should('exist');
      loadPage.stepSettings(stepName).click();
      loadPage.saveSettings(stepName).should('be.disabled');
      loadPage.cancelSettings(stepName).click();
      loadPage.stepName(stepName).click();
      loadPage.saveButton().should('be.disabled');
      loadPage.cancelButton().click();
      loadPage.deleteStepDisabled(stepName).should('exist');
  });

  it('should only enable Curate and Explorer tile for hub-central-mapping-reader', () => {
      let entityTypeId = 'Customer'
      let mapStepName = 'mapCustomersXML'
      cy.loginAsTestUserWithRoles('hub-central-mapping-reader').withRequest()
          .url().should('include', '/tile');
      //All tiles but Explore and Model, should show a tooltip that says contact your administrator
      ['Load', 'Model', 'Run'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
      });

      toolbar.getCurateToolbarIcon().click();
      curatePage.toggleEntityTypeId(entityTypeId);
      curatePage.verifyTabs(entityTypeId, 'be.visible', 'not.exist');
      curatePage.addNewMapStep().should('not.be.visible');
      curatePage.stepSettings(mapStepName).click();
      curatePage.saveSettings(mapStepName).should('be.disabled');
      curatePage.cancelSettings(mapStepName).click();
      curatePage.editStep(mapStepName).click();
      curatePage.verifyStepNameIsVisible(mapStepName);
      curatePage.saveEdit(mapStepName).should('be.disabled');
      curatePage.cancelEdit(mapStepName).click();
      curatePage.deleteDisabled().should('exist');
      curatePage.noEntityType().should('not.exist');
  });

  it('should only enable Run and Explorer tile for hub-central-step-runner', () => {
      const flowName = 'personJSON';
      const stepName = 'loadPersonJSON';
      cy.loginAsTestUserWithRoles('hub-central-step-runner').withRequest()
          .url().should('include', '/tile');
      //All tiles but Run and Explore, should show a tooltip that says contact your administrator
      ['Load', 'Model', 'Curate'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
      });

      toolbar.getRunToolbarIcon().click();
      runPage.createFlowButton().should('be.disabled');
      cy.findByText(flowName).should('be.visible');
      runPage.deleteFlowDisabled(flowName).should('exist');
      runPage.toggleFlowConfig(flowName);
      runPage.deleteStepDisabled(stepName).should('exist');
  });

  it('should only enable Run and Explorer tile for hub-central-flow-writer', () => {
      const flowName = 'personJSON';
      const stepName = 'loadPersonJSON';
      cy.loginAsTestUserWithRoles('hub-central-flow-writer').withRequest()
          .url().should('include', '/tile');
      //All tiles but Run and Explore, should show a tooltip that says contact your administrator
      ['Load', 'Model', 'Curate'].forEach((tile) => {
          toolbar.getToolBarIcon(tile).should('have.attr', {style: 'cursor: not-allowed'})
        });

      toolbar.getRunToolbarIcon().click();
      runPage.createFlowButton().should('be.enabled');
      cy.findByText(flowName).should('be.visible');
      runPage.deleteFlow(flowName).should('exist');
      runPage.deleteFlowDisabled(flowName).should('not.exist');
      runPage.toggleFlowConfig(flowName);
      runPage.deleteStep(stepName).click();
      runPage.deleteStepConfirmationMessage(stepName, flowName).should('be.visible');
      cy.findByLabelText('No').click();
  });

  it('should verify download of an HC project', () => {
      cy.loginAsTestUserWithRoles('hub-central-downloader').withUI();
      projectInfo.getAboutProject().click();
      projectInfo.waitForInfoPageToLoad();
      projectInfo.getDownloadButton().click();
  });

});
