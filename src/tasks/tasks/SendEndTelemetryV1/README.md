# SendEndTelemetry task

Sends job end telemetry to Helix.  A [SendStartTelemetry](../SendStartTelemetryV1/README.md) task must be called before calling this task.

## Yaml Schema

Standard [task schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#task)

Task specific schema

```YAML
steps:
  - task: sendEndTelemetry@0
    inputs:
      maxRetries: integer # [optional] maximum number of telemetry send attempts, default 10
      retryDelay: integer # [optional] number of seconds to wait between retry attempts
```

[Example](https://github.com/dotnet/arcade/blob/868001c607917d04669db9fd23c67322b3e165aa/eng/common/templates/job/job.yml#L153) usage in Arcade repo