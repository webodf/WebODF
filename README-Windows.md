## Building WebODF on Windows

The following steps have been tested with the Microsoft C\C++ compilers that are installed with Visual Studio 2010. It may be possible to use MinGW but it has not been verified.

### Prerequisites

- **Visual Studio 2010**

   We only need the C\C++ compilers but it is easier to get this by installing VS2010.

   The express version should work http://www.visualstudio.com/en-us/downloads#d-2010-express

   It can also be obtained from the Windows 7 SDK but I would recommend the above

- **Qt SDK 4.8.1**

   I would **strongly** recommend you install this specific version as there are problems running the Qt tests on later versions of 4.8.x

   The SDK built with VS 2010 can be downloaded from here http://download.qt-project.org/archive/qt/4.8/4.8.1/qt-win-opensource-4.8.1-vs2010.exe

- **CMake**

   The latest 32-bit installer from here works fine http://www.cmake.org/files/v2.8/cmake-2.8.12.2-win32-x86.exe

- **Git for Windows**

   Git isn't actually required but rather some Unix programs like cat are used during the build
   You can get this from here https://code.google.com/p/msysgit/downloads/list?q=full+installer+official+git

- **Java Runtime 1.7**

   Grab the latest runtime from here http://java.com/en/download/index.jsp

### Setup PATH variable

Add the following directories to the PATH variable

CMake path e.g `C:\Program Files (x86)\CMake 2.8\bin`

QMake path e.g `C:\QtSDK\bin`

Unix tools path e.g `C:\Program Files (x86)\Git\bin` (Git installer will add this automatically if you select the add Unix tools to PATH option during install)

### Building webodf.js
These commands should be entered from the Visual Studio 2010 command prompt so that msbuild will be added to the PATH

```
git clone https://github.com/kogmbh/WebODF.git webodf
md build
cd build
cmake -G "Visual Studio 10" ..\webodf
msbuild WebODF.sln
```