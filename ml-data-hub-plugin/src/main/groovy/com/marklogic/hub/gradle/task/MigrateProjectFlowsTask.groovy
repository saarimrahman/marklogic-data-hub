package com.marklogic.hub.gradle.task

import com.marklogic.gradle.task.AbstractConfirmableHubTask
import com.marklogic.hub.flow.impl.FlowMigrator

class MigrateProjectFlowsTask extends AbstractConfirmableHubTask {

    @Override
    void executeIfConfirmed() {
        new FlowMigrator(getProject().property("hubConfig")).migrateFlows()
    }
}
