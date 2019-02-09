import tl = require('vsts-task-lib/task');
var rp = require('request-promise');

async function Run() {
    try {
        // Variables provided from the environment (defined via SendStartTelemetry task)
        let helixJobToken = tl.getVariable('HELIX_JOBTOKEN')
        let helixworkItemId = tl.getVariable('HELIX_WORKITEMID');

        // Variables provided from task
        let maxRetries:number = parseInt(tl.getInput('maxRetries', true));
        let retryDelay:number = parseInt(tl.getInput('retryDelay', true)) * 1000;

        // Azure DevOps defined variables
        let agentJobStatus = process.env['AGENT_JOBSTATUS'] || '';

        let errorCount = 1;
        let warningCount = 0;
        if ( agentJobStatus == 'Succeeded' || agentJobStatus == 'PartiallySucceeded') {
            errorCount = 0;
        }

        let helixUri = `https://helix.dot.net/api/2018-03-14/telemetry/job/build/${helixworkItemId}/finish?errorCount=${errorCount}&warningCount=${warningCount}`;

        const helixBuildOptions = {
            uri: helixUri,
            method: 'POST',
            headers: {
                'X-Helix-Job-Token': helixJobToken
            },
            body: ''
        };

        let attempts:number = 0;
        let passed:boolean = false;
        var statusCode:number = 0;

        var delay = (ms:number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        console.log('Sending build end telemetry...');
        while(attempts < maxRetries && !passed) {
            await rp(helixBuildOptions)
                .then(function(body:any) {
                    passed = true;
                })
                .catch(function(err:any) {
                    console.log(`##vso[task.logissue]error ${err.message}`);
                    statusCode = err.statusCode;
                });
            if(!passed) {
                attempts++;
                console.log(`Attempt ${attempts} of ${maxRetries} failed with status code '${statusCode}'`);
                if(attempts < maxRetries) {
                    console.log(`Sleeping for ${retryDelay} ms...`);
                    await delay(retryDelay);
                }
            }
        }
        if(!passed) {
            console.log("##vso[task.logissue]error Send build end telemetry failed");
            return 1;
        }
        console.log('done');
        return 0;
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

Run();