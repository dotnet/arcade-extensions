**NOTE**: BashOrCmd, SendEndTelemetry, and SendStartTelemetry task have been deprecated and are no longer maintained. 

# Custom Azure DevOps tasks

## Prerequisites

- [Node.js](http://nodejs.org) 4.0.x or later and NPM (included with the installer)

## Creating a custom task

### Creating a new custom task

1. Task folder layout in this repo follows this format...

    ```text
    src/tasks/tasks
      /[TaskName]V[TaskVersion]
    ```

2. General task creation instructions are located [here](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=vsts#step-1-create-the-custom-task)

3. After writing your task, add an entry for your task into `src/tasks/make-options.json` in the "tasks" element.

4. Build the tasks using either `/build-tasks.cmd` or `src/tasks/build.cmd`

### Editing an existing custom task

After making changes to the source code, be sure to rev the major, minor, or patch version in the tasks task.json file.  If you do not rev this version, then Azure DevOps will not recognize that the task is different from an exisitng task and won't update the task when you deploy.

### Packaging the task in the extension

Extension packaging is controlled via the `buildtasks-extensions.json` and `buildtasks-anon-extension.json` files.

[Extension layout guidelines](https://docs.microsoft.com/en-us/azure/devops/extend/develop/integrate-build-task?view=vsts#multiple-version-layout)

1. Modify `buildtasks-extsions.json` and `buildtasks-anon-extension.json` and add appropriate entries for your created task.

2. Currently, you must manually increment the version number for the manifest you are creating

```json
    "manifestVersion": 1,
    "id": "dnceng-build-release-tasks",
    "name": "Dnceng Build Tasks",
    "version": "0.0.1", <== manually rev to "0.0.2" before packaging
    "publisher": "dotnet-dnceng",
```

### Publishing

Note: See [Developer publishing flow](#developer-publishing-flow) before publishing so that you can validate your changes before exposing them to dnceng.

We have a [dotnet-dnceng publisher](https://marketplace.visualstudio.com/manage/publishers/dotnet-dnceng) defined in the VS Marketplace.

1. Find the "Dnceng Build Tasks" extension, select "..." and choose "Update"

2. Upload the extension you created from the `.artifacts/extensions` folder

3. The extension will now get published to all participating Azure DevOps accounts

### Developer publishing flow

The "dotnet-dnceng" publisher mentioned in [Publishing](#publishing) will immediately update the dnceng account with any extension changes you have made.

For testing purposes, you should create your own publisher which publishes to your own organization and use that flow to validate your task changes before using the dotnet-dnceng publisher to expose your changes to the dnceng organization.
