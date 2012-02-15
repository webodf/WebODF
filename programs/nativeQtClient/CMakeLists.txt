include(${QT_USE_FILE})
include_directories(${CMAKE_CURRENT_BINARY_DIR} ${QT_QTCORE_INCLUDE_DIR})
QT4_WRAP_CPP(NATIVEQTCLIENT_MOC
    odfview.h
    ../qtjsruntime/nativeio.h
    ../qtjsruntime/nam.h
    )
FILE(COPY application.qrc DESTINATION ${CMAKE_BINARY_DIR}/programs/android/assets)
QT4_ADD_RESOURCES(NATIVEQTCLIENT_RES ${CMAKE_BINARY_DIR}/programs/android/assets/application.qrc)
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
    # copy the common webodf.css, webodf.js
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_CURRENT_BINARY_DIR}/www/webodf.css
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_BINARY_DIR}/www/webodf.js
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_CURRENT_SOURCE_DIR}/application.qrc
        ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
    DEPENDS
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_SOURCE_DIR}/application.qrc
)

macro(COPY_FILES _varname _srcdir _tgtdir)
  foreach(_file ${ARGN})
    GET_FILENAME_COMPONENT(_subdir ${_file} PATH)
    FILE(MAKE_DIRECTORY ${_tgtdir}/${_subdir})
    add_custom_command(
      OUTPUT ${_tgtdir}/${_file}
      COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${_srcdir}/${_file}
        ${_tgtdir}/${_file}
      DEPENDS
        ${_srcdir}/${_file}
    )
    set(${_varname} ${${_varname}} ${_tgtdir}/${_file})
  endforeach(_file)
endmacro(COPY_FILES _directory _files)

COPY_FILES(NATIVEDEPS ${CMAKE_SOURCE_DIR}/webodf ${CMAKE_CURRENT_BINARY_DIR}/www
    ${LIBJSFILES})
COPY_FILES(NATIVEDEPS ${CMAKE_SOURCE_DIR}/programs/android/assets/www
    ${CMAKE_CURRENT_BINARY_DIR}/www ${HTML5UIFILES})
add_custom_target(nativeQtClientDepencencies ALL DEPENDS ${NATIVEDEPS})

add_executable(nativeQtClient
    main.cpp
    odfview.cpp
    ../qtjsruntime/nativeio.cpp
    odfpage.cpp ${NATIVEQTCLIENT_MOC} ${NATIVEQTCLIENT_UI}
    ${NATIVEQTCLIENT_RES})

target_link_libraries(nativeQtClient ${QT_LIBRARIES})
add_dependencies(nativeQtClient nativeQtClientDepencencies)
