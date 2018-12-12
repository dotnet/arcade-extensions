@echo off
setlocal
set repoRoot=%~dp0
set artifactPath=%repoRoot%.artifacts\
set npmPrefix=%artifactPath%npm

REM Install the TFX-CLI for task / extension management https://github.com/Microsoft/tfs-cli
call npm install --prefix %npmPrefix% tfx-cli
set tfxCmd=%repoRoot%\.artifacts\npm\tfx.cmd

call %tfxCmd% extension create --manifest-globs %repoRoot%buildtasks-extension.json --output-path %artifactPath%extensions
endlocal