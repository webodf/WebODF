include(${QT_USE_FILE})
include_directories(${CMAKE_CURRENT_BINARY_DIR} ${QT_QTCORE_INCLUDE_DIR})
QT4_WRAP_CPP(NATIVEQTCLIENT_MOC
    mainwindow.h
    odfview.h
    ../qtjsruntime/nativeio.h
    ../qtjsruntime/nam.h
    )
QT4_WRAP_UI(NATIVEQTCLIENT_UI mainwindow.ui)
FILE(COPY application.qrc DESTINATION ${CMAKE_CURRENT_BINARY_DIR})
QT4_ADD_RESOURCES(NATIVEQTCLIENT_RES ${CMAKE_CURRENT_BINARY_DIR}/application.qrc)
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
    # copy the common webodf.css, webodf.js
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_CURRENT_BINARY_DIR}/webodf.css
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/embedodf.html
        ${CMAKE_CURRENT_BINARY_DIR}/embedodf.html
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_BINARY_DIR}/webodf.js
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_CURRENT_SOURCE_DIR}/application.qrc
        ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
    DEPENDS
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_SOURCE_DIR}/webodf/embedodf.html
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_SOURCE_DIR}/application.qrc
)
add_executable(nativeQtClient
    main.cpp
    mainwindow.cpp
    odfview.cpp
    ../qtjsruntime/nativeio.cpp
    odfpage.cpp ${NATIVEQTCLIENT_MOC} ${NATIVEQTCLIENT_UI}
    ${NATIVEQTCLIENT_RES})

target_link_libraries(nativeQtClient ${QT_LIBRARIES})
add_dependencies(nativeQtClient webodf.js)
