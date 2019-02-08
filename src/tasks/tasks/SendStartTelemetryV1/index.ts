import tl = require('vsts-task-lib/task');
import https = require('https');

function CheckForRequiredEnvironmentVariable(variableName:string):boolean {
    if(process.env[variableName] === undefined) {
        console.log(`Missing required variable "${variableName}"`);
        return false;
    }
    return true;
}

async function run() {
    try {
        // ToDos:
        // - parameterize job body
        // - add retries
        let validEnvironment:boolean = true;
        validEnvironment = CheckForRequiredEnvironmentVariable("INPUTHELIXREPO") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("INPUTHELIXTYPE") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("INPUTBUILDCONFIG") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_SOURCEBRANCH") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("SYSTEM_TEAMPROJECT") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_REASON") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("AGENT_OS") && validEnvironment;
        validEnvironment = CheckForRequiredEnvironmentVariable("BUILD_BUILDNUMBER") && validEnvironment;

        if(!validEnvironment) {
            throw 'One or more required variables are missing';
        }

        // Variables provided from task
        let helixRepo = process.env['INPUTHELIXREPO'];
        let helixType = process.env['INPUTHELIXTYPE'];
        let maxRetries = process.env['INPUTMAXRETRIES'];
        let retryDelay = process.env['INPUTRETRYDELAY'];
        let runAsPublic = process.env['INPUTRUNASPUBLIC'] == 'true' ? true: false;
        let buildConfig = process.env['INPUTBUILDCONFIG'];

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
        const postData = '{ ' +
                `"QueueId": "${agentOs}", ` +
                `"Source": "${helixSource}", ` +
                `"Type": "${helixType}", ` +
                `"Build": "${buildNumber}", ` +
                '"Attempt": "1", ' +
                `"Properties": { "operatingSystem": "${agentOs}", "configuration": "${buildConfig}" } ` +
                '}';

        const options = {
            hostname: 'helix.dot.net',
            path: '/api/2018-03-14/telemetry/job',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }

        };
        const request = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                let helixAccessToken:string = chunk;
                helixAccessToken = helixAccessToken.replace(/"/g, ""); // strip quotes
                console.log(`##vso[task.setvariable variable=Helix_JobToken;issecret=true;]${helixAccessToken}`);
            });
        });
        request.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        console.log(`Posting Job Info: ${postData}`);
        request.write(postData);
        request.end();

        // todo: check status code
        return 0;
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();