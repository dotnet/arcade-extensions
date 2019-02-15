# SendStartTelemetry task

Sends job start telemetry to Helix.  A [SendEndTelemetry](../SendEndTelemetryV1/README.md) task must also be called after this task to finalize Helix telemetry sending.

Task usage example

```YAML
steps:
  - task: sendStartTelemetry@0
    inputs:
      helixRepo: dotnet/arcade
      buildConfig: $(_buildConfig)
  - script: echo Hello World!
  - task: sendEndTelemetry@0
```

## Yaml Schema

Standard [task schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#task)

Task specific schema

```YAML
steps:
  - task: sendStartTelemetry@0
    inputs:
      helixRepo: string    # [required] org / repo string, ie. dotnet/arcade
      buildConfig: string  # [required] differentiate build configuration, ie. Debug or Release
      helixType: string    # [optional] type of telemetry to send, default 'build/product'
      runAsPublic: boolean # [optional] always send telemetry as public, default false
      maxRetries: integer  # [optional] maximum number of telemetry send attempts, default 10
      retryDelay: integer  # [optional] number of seconds to wait between retry attempts
```

**Note:** If you are sending telemetry from an internal build (and "runAsPublic" is not "True"), then a "HelixApiAccessToken" variable must be set.  See the [job template](https://github.com/dotnet/arcade/blob/868001c607917d04669db9fd23c67322b3e165aa/azure-pipelines.yml#L44) for how this is done in Arcade.

[Example](https://github.com/dotnet/arcade/blob/868001c607917d04669db9fd23c67322b3e165aa/eng/common/templates/job/job.yml#L117) usage in Arcade repo