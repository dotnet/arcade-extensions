@echo off
pushd %~dp0
call vsts-npm-auth -config .npmrc
call npm run build
popd
