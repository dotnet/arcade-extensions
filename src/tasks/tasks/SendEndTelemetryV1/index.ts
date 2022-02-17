import tl = require('azure-pipelines-task-lib/task');
var rp = require('request-promise');

async function Run() {
    try {
        // Variables provided from the environment (defined via SendStartTelemetry task)
        let helixJobToken = tl.getVariable('HELIX_JOBTOKEN')
        let helixworkItemId = tl.getVariable('HELIX_WORKITEMID');

        // Variables provided from task

        let maxRetriesProto = tl.getInput('maxRetries', true);
        let maxRetries : number;
        if (typeof maxRetriesProto === "string") {
            maxRetries = parseInt(maxRetriesProto);
        } else {
            maxRetries = 0;
        }

        let retryDelayProto = tl.getInput('retryDelay', true);
        let retryDelay : number;
        if(typeof retryDelayProto === "string") {
            retryDelay = parseInt(retryDelayProto) * 1000;
        } else {
            retryDelay = 0;
        }

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
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        } else {
            tl.setResult(tl.TaskResult.Failed, "Unknown Error");
        }
    }
}

Run();