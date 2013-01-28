# WebODF is mostly a JavaScript project. CMake needs to know about the C++ parts
project (WebODF C CXX)
# version 2.8.2 is needed to have support for zip files in external projects
cmake_minimum_required(VERSION 2.8.2)

# At this point, the version number that is used throughout is defined
set(WEBODF_VERSION 0.4.2)

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

# allow specification of a directory with pre-downloaded
# requirements by evaluating environment variable
# $WEBODF_DOWNLOAD_DIR
# defaults to ./downloads in the build directory.
if ( IS_DIRECTORY $ENV{WEBODF_DOWNLOAD_DIR} )
    SET ( EXTERNALS_DOWNLOAD_DIR $ENV{WEBODF_DOWNLOAD_DIR} )
else ( IS_DIRECTORY $ENV{WEBODF_DOWNLOAD_DIR} )
    SET ( EXTERNALS_DOWNLOAD_DIR ${CMAKE_BINARY_DIR}/downloads )
endif ( IS_DIRECTORY $ENV{WEBODF_DOWNLOAD_DIR} )
MESSAGE ( STATUS "external downloads will be stored/expected in: ${EXTERNALS_DOWNLOAD_DIR}" )

if(Java_JAVA_EXECUTABLE)
    # Closure Compiler
    ExternalProject_Add(
        ClosureCompiler
        DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
        URL "http://closure-compiler.googlecode.com/files/compiler-20121212.tar.gz"
        URL_MD5 5382a18184ee4cc45cc6c92f06b74ebc
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
        DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
        URL "http://ftp.mozilla.org/pub/js/rhino1_7R3.zip"
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
    DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
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
    PREFIX ${CMAKE_BINARY_DIR}/NodeJS-prefix
    DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
    URL "http://nodejs.org/dist/v0.8.14/node-v0.8.14.tar.gz"
    URL_MD5 284fd2c7578064c339d9cf6a3a475ac7
    CONFIGURE_COMMAND ./configure --prefix=${CMAKE_BINARY_DIR}/NodeJS-prefix
    INSTALL_DIR ${CMAKE_BINARY_DIR}/NodeJS-prefix
    BUILD_IN_SOURCE 1
)
set(NODE ${CMAKE_BINARY_DIR}/NodeJS-prefix/bin/node)
set(NODE_NPM ${CMAKE_BINARY_DIR}/NodeJS-prefix/bin/npm)

# copy node_modules directory from source to build
# (this is needed if a module is required in there)
add_custom_target(copy_node_modules ALL
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_SOURCE_DIR}/node_modules ${CMAKE_BINARY_DIR}/node_modules
    COMMENT copying node_modules from source to build
)

# JSCoverage
ExternalProject_Add(
    JSCoverage
    DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
    URL "http://siliconforks.com/jscoverage/download/jscoverage-0.5.1.tar.bz2"
    URL_MD5 a70d79a6759367fbcc0bcc18d6866ff3
    PATCH_COMMAND patch -p0 < ${CMAKE_CURRENT_SOURCE_DIR}/JSCoverage.patch
    CONFIGURE_COMMAND "./configure"
    BUILD_IN_SOURCE 1
    INSTALL_COMMAND ""
)
set(JSCOVERAGE ${CMAKE_BINARY_DIR}/JSCoverage-prefix/src/JSCoverage/jscoverage)

# Dojo
ExternalProject_Add(
    Dojo
    DOWNLOAD_DIR ${EXTERNALS_DOWNLOAD_DIR}
    URL "http://download.dojotoolkit.org/release-1.8.1/dojo-release-1.8.1-src.tar.gz"
    URL_MD5 9b80b9a736b81c336accd832f3c3aea2
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND ""
)
set(DOJO ${CMAKE_BINARY_DIR}/Dojo-prefix/src/Dojo/)

# Android
if (NOT ANDROID_SDK_DIR)
  find_path(ANDROID_SDK_DIR platform-tools/aapt)
endif(NOT ANDROID_SDK_DIR)
if (NOT ANT)
  find_file(ANT NAMES ant ant.exe /usr/bin /usr/local/bin)
endif(NOT ANT)

set(LIBJSFILES lib/packages.js lib/runtime.js lib/core/Base64.js

    lib/core/RawDeflate.js
    lib/core/ByteArray.js
    lib/core/ByteArrayWriter.js
    lib/core/RawInflate.js
    lib/core/Selection.js
    lib/core/LoopWatchDog.js
    lib/core/Cursor.js
    lib/core/EditInfo.js
    lib/core/UnitTester.js
    lib/core/PositionIterator.js
    lib/core/PositionFilter.js
    lib/core/Async.js
    lib/core/Zip.js
    lib/core/CSSUnits.js

    lib/xmldom/LSSerializerFilter.js
    lib/xmldom/LSSerializer.js
    lib/xmldom/RelaxNGParser.js
    lib/xmldom/RelaxNG.js
    lib/xmldom/RelaxNG2.js
    lib/xmldom/OperationalTransformInterface.js
    lib/xmldom/OperationalTransformDOM.js
    lib/xmldom/XPath.js

    lib/odf/StyleInfo.js
    lib/odf/Style2CSS.js
    lib/odf/FontLoader.js
    lib/odf/OdfContainer.js
    lib/odf/Formatting.js
    lib/odf/OdfCanvas.js
    lib/odf/CommandLineTools.js

    lib/ops/Operation.js
    lib/ops/OpAddCursor.js
    lib/ops/OpRemoveCursor.js
    lib/ops/OpMoveCursor.js
    lib/ops/OpInsertText.js
    lib/ops/OpRemoveText.js
    lib/ops/OpSplitParagraph.js
    lib/ops/OpSetParagraphStyle.js
    lib/ops/OpUpdateParagraphStyle.js
    lib/ops/OperationFactory.js
    lib/gui/SelectionMover.js
    lib/gui/Avatar.js
    lib/gui/Caret.js
    lib/gui/SessionController.js
    lib/gui/SelectionManager.js
    lib/ops/UserModel.js
    lib/ops/TrivialUserModel.js
    lib/ops/NowjsUserModel.js
    lib/ops/TrivialOperationRouter.js
    lib/ops/NowjsOperationRouter.js
    lib/gui/EditInfoHandle.js
    lib/gui/EditInfoMarker.js
    lib/gui/SessionView.js
    lib/gui/CaretFactory.js
    lib/gui/PresenterUI.js
    lib/gui/XMLEdit.js

    lib/ops/SessionPointFilter.js
    lib/ops/Document.js
    lib/ops/Session.js
    lib/ops/SessionImplementation.js

)

set(HTML5UIFILES
  app/app.js
  app/controller/Files.js
  app/model/FileSystem.js
  app/views/FileDetail.js
  app/views/FilesList.js
  app/views/OdfView.js
  app/views/Viewport.js
  sencha-touch.css
  sencha-touch.js
  app/store/FileStore.js
  ZoomOut.png
  ZoomIn.png
  go-previous.png
  go-next.png
  zoom-fit-width.png
  zoom-fit-best.png
  zoom-fit-height.png
)

set (RUNTIME ${CMAKE_CURRENT_SOURCE_DIR}/webodf/lib/runtime.js)

macro(COPY_FILES _varname _srcdir _tgtdir)
  foreach(_file ${ARGN})
    GET_FILENAME_COMPONENT(_subdir ${_file} PATH)
    FILE(MAKE_DIRECTORY ${_tgtdir}/${_subdir})
    if (IS_ABSOLUTE ${_file})
      SET(_srcfile ${_file})
    else (IS_ABSOLUTE ${_file})
      SET(_srcfile ${_srcdir}/${_file})
    endif (IS_ABSOLUTE ${_file})
    add_custom_command(
      OUTPUT ${_tgtdir}/${_file}
      COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${_srcfile}
        ${_tgtdir}/${_file}
      DEPENDS
        ${_srcfile}
    )
    set(${_varname} ${${_varname}} ${_tgtdir}/${_file})
  endforeach(_file)
endmacro(COPY_FILES _directory _files)

add_subdirectory(webodf)
add_subdirectory(programs)

# package webodf
set(WEBODFZIP webodf-${WEBODF_VERSION}.zip)
set(WEBODFZIP_FILES
  ${CMAKE_BINARY_DIR}/webodf/webodf-debug.js
  ${CMAKE_BINARY_DIR}/webodf/webodf.js
  ${CMAKE_SOURCE_DIR}/webodf/webodf.css
)
add_custom_command(
    OUTPUT ${WEBODFZIP}
    # zip using javascript code running in node.js
    COMMAND ${NODE} ARGS webodf/lib/runtime.js packwebodf.js
        ${CMAKE_BINARY_DIR}/${WEBODFZIP}
#input files
        ${WEBODFZIP_FILES}
#output files
        webodf-debug.js
        webodf.js
        webodf.css
    DEPENDS NodeJS
        packwebodf.js
        ${WEBODFZIP_FILES}
        webodf-debug.js
        webodf.js
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
add_custom_target(zip ALL DEPENDS ${WEBODFZIP})

# vim:expandtab
