import tl = require('vsts-task-lib/task');
var rp = require('request-promise');
var qs = require('querystring');

function CheckForRequiredEnvironmentVariable(variableName:string):boolean {
    if(process.env[variableName] === undefined) {
        console.log(`Missing required variable "${variableName}"`);
        return false;
    }
    return true;
}

function Delay(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function Run() {
    try {
        let validEnvironment:boolean = true;
        validEnvironment = CheckForRequiredEnvironmentVariable("HELIX_JOBTOKEN") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("HELIX_WORKITEMID") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("AGENT_JOBSTATUS") && validEnvironment;

        if(!validEnvironment) {
            throw 'One or more required variables are missing';
        }

        var GetEnvironmentVariableAsNumber = (variableKey:string) => {
            let variableValue = process.env[variableKey];
            if(variableValue === undefined) {
                return 0;
            }
            let numberValue:number = parseInt(variableValue)
            return numberValue;
        }

        // Variables provided from the environment (defined via SendStartTelemetry task)
        let helixJobToken = process.env['HELIX_JOBTOKEN'];
        let helixworkItemId = process.env['HELIX_WORKITEMID'];

        // Variables provided from task
        let maxRetries:number = parseInt(tl.getInput('maxRetries', true));
        let retryDelay:number = parseInt(tl.getInput('retryDelay', true)) * 1000;

        // Azure DevOps defined variables
        let agentJobStatus = process.env['AGENT_JOBSTATUS'];

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
                    await Delay(retryDelay);
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