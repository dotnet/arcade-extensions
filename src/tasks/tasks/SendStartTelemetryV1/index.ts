import tl = require('vsts-task-lib/task');
var jobInfoRequestPromise = require('request-promise');
var buildInfoRequestPromise = require('request-promise');
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
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_SOURCEBRANCH") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("SYSTEM_TEAMPROJECT") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_REASON") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("AGENT_OS") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_BUILDNUMBER") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("SYSTEM_TASKDEFINITIONSURI") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("SYSTEM_TEAMPROJECT") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_BUILDID") && validEnvironment;

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
        // Variables provided from task
        let helixRepo = tl.getInput('helixRepo', true);
        let helixType = tl.getInput('helixType', true);
        let maxRetries:number = parseInt(tl.getInput('maxRetries', true));
        let retryDelay:number = parseInt(tl.getInput('retryDelay', true)) * 1000;
        let runAsPublic = tl.getBoolInput('runAsPublic') || false;
        let buildConfig = tl.getInput('buildConfig');
        let helixApiAccessToken = tl.getVariable('HelixApiAccessToken');

        // Azure DevOps defined variables
        let sourceBranch = process.env['BUILD_SOURCEBRANCH'];
        let teamProject = process.env['SYSTEM_TEAMPROJECT'];
        let buildReason = process.env['BUILD_REASON'];
        let agentOs = process.env['AGENT_OS'];
        let buildNumber = process.env['BUILD_BUILDNUMBER'];

        let helixSource:string;
        if(runAsPublic || teamProject == 'public' || buildReason == 'PullRequest') {
            helixSource = `pr/${helixRepo}/${sourceBranch}`;
        }
        else {
            helixSource = `official/${helixRepo}/${sourceBranch}`;
        }
        // Job info body
        const postJobInfoData = '{ ' +
                `"QueueId": "${agentOs}", ` +
                `"Source": "${helixSource}", ` +
                `"Type": "${helixType}", ` +
                `"Build": "${buildNumber}", ` +
                '"Attempt": "1", ' +
                `"Properties": { "operatingSystem": "${agentOs}", "configuration": "${buildConfig}" } ` +
                '}';
        console.log(`Posting job info: ${postJobInfoData}`);

        let helixJobInfoUri = 'https://helix.dot.net/api/2018-03-14/telemetry/job';
        if(helixApiAccessToken !== undefined && helixApiAccessToken != '') {
            helixJobInfoUri = `${helixJobInfoUri}?access_token=${helixApiAccessToken}`;
        }
        const helixJobOptions = {
            uri: helixJobInfoUri,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(postJobInfoData)
            },
            body: postJobInfoData
        };

        var helixJobToken:string = '';
        var statusCode:number = 0;
        let attempts:number = 0;
        var passed:boolean = false;
        console.log('Sending job start telemetry...');
        while(attempts < maxRetries && !passed) {
            await jobInfoRequestPromise(helixJobOptions)
                .then(function(body:any) {
                    helixJobToken = body;
                    helixJobToken = helixJobToken.replace(/"/g, ""); // strip quotes
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
            console.log('##vso[task.logissue]error Send job start telemetry failed');
            return 1;
        }

        console.log(`##vso[task.setvariable variable=Helix_JobToken;issecret=true;]${helixJobToken}`);

        // encode buildUri
        let buildUri:string = qs.stringify({buildUri: `${process.env["SYSTEM_TASKDEFINITIONSURI"]}${process.env["SYSTEM_TEAMPROJECT"]}/_build/index?buildId=${process.env["BUILD_BUILDID"]}&_a=summary`});
        let helixBuildInfoUri = `https://helix.dot.net/api/2018-03-14/telemetry/job/build?${buildUri}`;

        const helixBuildOptions = {
            uri: helixBuildInfoUri,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Helix-Job-Token': helixJobToken
            },
            body: ''
        };

        attempts = 0;
        passed = false;
        let helixWorkItemId:string = '';

        console.log('Sending build start telemetry...');
        while(attempts < maxRetries && !passed) {
            await buildInfoRequestPromise(helixBuildOptions)
                .then(function(body:any) {
                    helixWorkItemId = body;
                    helixWorkItemId = helixWorkItemId.replace(/"/g, ""); // strip quotes
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
            console.log("##vso[task.logissue]error Send build start telemetry failed");
            return 1;
        }
        console.log(`##vso[task.setvariable variable=Helix_WorkItemId]${helixWorkItemId}`);
        console.log('done');
        return 0;
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

Run();