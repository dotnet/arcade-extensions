import tl = require('azure-pipelines-task-lib/task');
import requestWithRetry from './azure-devops-request-with-retry';
var qs = require('querystring');

async function Run() {
    try {
        // Variables provided from task
        let helixRepo = tl.getInput('helixRepo', true);
        let helixType = tl.getInput('helixType', true);
        let runAsPublic = tl.getBoolInput('runAsPublic') || false;
        let buildConfig = tl.getInput('buildConfig');
        let helixApiAccessToken = tl.getVariable('HelixApiAccessToken');

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
        let sourceBranch = process.env['BUILD_SOURCEBRANCH'];
        let teamProject = process.env['SYSTEM_TEAMPROJECT'];
        let buildReason = process.env['BUILD_REASON'];
        let agentOs = process.env['AGENT_OS'];
        let buildNumber = process.env['BUILD_BUILDNUMBER'];
        let jobAttempt = process.env['SYSTEM_JOBATTEMPT'] || '1';

        let helixSource:string;

        if(runAsPublic || teamProject == 'public' || buildReason == 'PullRequest') {
            helixSource = `pr/${helixRepo}/${sourceBranch}`;
        }
        else {
            helixSource = `official/${helixRepo}/${sourceBranch}`;
        }
        const postJobInfoData = '{ ' +
                `"QueueId": "${agentOs}", ` +
                `"Source": "${helixSource}", ` +
                `"Type": "${helixType}", ` +
                `"Build": "${buildNumber}", ` +
                `"Attempt": "${jobAttempt}", ` +
                `"Properties": { "operatingSystem": "${agentOs}", "configuration": "${buildConfig}" } ` +
                '}';

        console.log(`Posting job info: ${postJobInfoData}`);

        let helixApiUriBase = 'https://helix.dot.net/api/2018-03-14';
        let helixJobInfoUri = `${helixApiUriBase}/telemetry/job`;
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
        console.log('Sending job start telemetry...');
        let jobResult = await requestWithRetry(helixJobOptions, maxRetries, retryDelay);
        if(jobResult.statusCode < 200 || jobResult.statusCode > 399) {
            console.log('##vso[task.logissue]error Send job start telemetry failed');
            return 1;
        }
        var helixJobToken:string = jobResult.message.replace(/"/g, "");
        
        console.log(`##vso[task.setvariable variable=Helix_JobToken;issecret=true;]${helixJobToken}`);

        let buildUri:string = qs.stringify({buildUri: `${process.env["SYSTEM_TASKDEFINITIONSURI"]}${process.env["SYSTEM_TEAMPROJECT"]}/_build/index?buildId=${process.env["BUILD_BUILDID"]}&_a=summary`});
        let helixBuildInfoUri = `${helixApiUriBase}/telemetry/job/build?${buildUri}`;
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

        console.log('Sending build start telemetry...');
        let buildResult = await requestWithRetry(helixBuildOptions, maxRetries, retryDelay);
        if(buildResult.statusCode < 200 || buildResult.statusCode >399) {
            console.log("##vso[task.logissue]error Send build start telemetry failed");
            return 1;
        }
        let helixWorkItemId:string = buildResult.message.replace(/"/g, "");
        console.log(`##vso[task.setvariable variable=Helix_WorkItemId]${helixWorkItemId}`);
        
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
