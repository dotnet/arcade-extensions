# Arcade-extensions

This repo contains the custom build tasks used by dnceng which are distributed in the ["DncEng Build Tasks"](https://marketplace.visualstudio.com/items?itemName=dotnet-dnceng.dnceng-build-release-tasks&targetId=b55de4ed-4b5a-4215-a8e4-0a0a5f71e7d8&utm_source=vstsproduct&utm_medium=ExtHubManageList) extension.

## Overview

[Tasks overview](https://github.com/dotnet/arcade/blob/main/Documentation/Projects/DevOps/Tasks/OnePager.md)

## Contributing

Creating a custom build task instructions are [here](./src/tasks/Readme.md)

## Deprecation Notice

The following tasks have been deprecated and will no longer be maintained: 

- BashOrCmdV1
- SendEndTelemetryV1
- SendStartTelemetryV1

Several npm packages have also been uninstalled from the repo as they did not appear to be used. If you are in this repo to update a package, be sure to investigate to see if it's needed (the `build` and `package` scripts utilize some Javascript code). It may be easier to uninstall a package instead of maintaining it. 