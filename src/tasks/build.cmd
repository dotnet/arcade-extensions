@echo off
setlocal

REM Usage:
REM  build.cmd -- build all tasks defined in /make-options.json
REM  build.cmd Foo -- build the task named Foo
REM  set task_pattern=Foo&&build.cmd -- build the task named Foo

IF NOT "%1" == "" set task_pattern=%1
pushd %~dp0
node make.js build --task %task_pattern%
popd
endlocal