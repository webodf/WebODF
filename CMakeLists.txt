# WebODF is mostly a JavaScript project. CMake needs to know about the C++ parts
project (WebODF C CXX)
# version 2.8.2 is needed to have support for zip files in external projects
cmake_minimum_required(VERSION 2.8.2)

# This makefile 'compiles' WebODF using various tools, instruments the code and
# builds and packages programs that use WebODF.

# Find installed dependencies
find_package(Qt4 4.7.0 COMPONENTS QtCore QtGui QtXml QtNetwork QtWebKit)
if (NOT QT4_FOUND)
  message(WARNING "Qt4 with modules QtCore QtGui QtXml QtNetwork QtWebKit was not found. qtjsruntime will no be built.")
endif (NOT QT4_FOUND)

# java runtime is needed for Closure Compiler
find_package(Java COMPONENTS Runtime)

if (CMAKE_SOURCE_DIR STREQUAL CMAKE_BINARY_DIR)
  message(FATAL_ERROR "Compiling in the source directortory is not supported. Use for example 'mkdir build; cd build; cmake ..'.")
endif (CMAKE_SOURCE_DIR STREQUAL CMAKE_BINARY_DIR)

# Tools must be obtained to work with:
include (ExternalProject)

if(Java_JAVA_EXECUTABLE)
    # Closure Compiler
    ExternalProject_Add(
        ClosureCompiler
        URL "http://closure-compiler.googlecode.com/files/compiler-20111003.tar.gz"
        URL_MD5 6108a6f2c3b3e357f8758a24ea8b01c6
        CONFIGURE_COMMAND ""
        BUILD_COMMAND ""
        INSTALL_COMMAND ""
    )
    set(CLOSURE_JAR ${CMAKE_BINARY_DIR}/ClosureCompiler-prefix/src/ClosureCompiler/compiler.jar)
endif(Java_JAVA_EXECUTABLE)

# Rhino
if(Java_JAVA_EXECUTABLE)
    ExternalProject_Add(
        Rhino
        URL "ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip"
        URL_MD5 99d94103662a8d0b571e247a77432ac5
        CONFIGURE_COMMAND ""
        BUILD_COMMAND ""
        INSTALL_COMMAND ""
    )
    set(RHINO ${CMAKE_BINARY_DIR}/Rhino-prefix/src/Rhino/js.jar)
endif(Java_JAVA_EXECUTABLE)

# JSDoc
ExternalProject_Add(
    JsDoc
    URL "http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.4.0.zip"
    URL_MD5 a8f78f5ecd24b54501147b2af341a231
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND ""
)
set(JSDOCDIR ${CMAKE_BINARY_DIR}/JsDoc-prefix/src/JsDoc/jsdoc-toolkit)

# Node.JS
ExternalProject_Add(
    NodeJS
    URL "http://nodejs.org/dist/node-v0.4.12.tar.gz"
    URL_MD5 a6375eaa43db5356bf443e25b828ae16
    INSTALL_COMMAND ""
)
set(NODE ${CMAKE_BINARY_DIR}/NodeJS-prefix/src/NodeJS-build/default/node)

# JSCoverage
ExternalProject_Add(
    JSCoverage
    URL "http://siliconforks.com/jscoverage/download/jscoverage-0.5.1.tar.bz2"
    URL_MD5 a70d79a6759367fbcc0bcc18d6866ff3
    PATCH_COMMAND patch -p0 < ${CMAKE_CURRENT_SOURCE_DIR}/JSCoverage.patch
    CONFIGURE_COMMAND "./configure"
    BUILD_IN_SOURCE 1
    INSTALL_COMMAND ""
)
set(JSCOVERAGE ${CMAKE_BINARY_DIR}/JSCoverage-prefix/src/JSCoverage/jscoverage)

# Android
find_path(ANDROID_SDK_DIR platform-tools/aapt)

add_subdirectory(webodf)
add_subdirectory(programs)
# vim:expandtab
