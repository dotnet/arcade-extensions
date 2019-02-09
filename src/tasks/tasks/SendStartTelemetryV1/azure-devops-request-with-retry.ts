class RequestResult {
    public statusCode:number = 0;
    public message:string = '';
}

function Delay(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function (options:any, maxAttempts = 1, retryDelayInMs = 5000): Promise<RequestResult> {
    let attempts = 0;
    let passed = false;
    let requestPromise = require('request-promise');
    var result:RequestResult = new RequestResult;

    while(attempts < maxAttempts && !passed) {
        await requestPromise(options)
            .then(function(body:any) {
                result.message = body;
                result.statusCode = 200;
                passed = true;
            })
            .catch(function(err:any) {
                console.log(`##vso[task.logissue]error ${err.message}`);
                result.statusCode = err.statusCode;
                result.message = err.message;
            });
        if(!passed) {
            attempts++;
            console.log(`Attempt ${attempts} of ${maxAttempts} failed with status code '${result.statusCode}'`);
            if(attempts < maxAttempts) {
                console.log(`Sleeping for ${retryDelayInMs} ms...`);
                await Delay(retryDelayInMs);
            }
        }
    }
    return result;
} 