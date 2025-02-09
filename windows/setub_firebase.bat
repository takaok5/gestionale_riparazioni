@echo off
setlocal

set FIREBASE_VERSION=11.8.0
set DOWNLOAD_URL=https://firebase.google.com/download/cpp/firebase_cpp_sdk_windows_v%FIREBASE_VERSION%.zip
set SDK_DIR=firebase_cpp_sdk_windows

echo Downloading Firebase C++ SDK...
curl -L -o firebase_cpp_sdk.zip %DOWNLOAD_URL%

echo Extracting Firebase C++ SDK...
powershell Expand-Archive firebase_cpp_sdk.zip -DestinationPath %SDK_DIR% -Force

echo Cleaning up...
del firebase_cpp_sdk.zip

echo Firebase SDK setup complete!
endlocal