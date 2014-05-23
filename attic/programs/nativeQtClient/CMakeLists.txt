include(${QT_USE_FILE})
include_directories(${CMAKE_CURRENT_BINARY_DIR} ${QT_QTCORE_INCLUDE_DIR})
QT4_WRAP_CPP(NATIVEQTCLIENT_MOC
    odfview.h
    ../qtjsruntime/nativeio.h
    ../qtjsruntime/nam.h
)
file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
        "<RCC><qresource prefix='/'>")
foreach(FILE ${TOUCHUI_FILES} index.html scripts.js webodf.js)
    if (IS_ABSOLUTE ${FILE})
        GET_FILENAME_COMPONENT(_wwwfile ${FILE} NAME)
    else (IS_ABSOLUTE ${FILE})
        SET(_wwwfile ${FILE})
    endif (IS_ABSOLUTE ${FILE})
    file(APPEND ${CMAKE_CURRENT_BINARY_DIR}/application.qrc "<file>www/${_wwwfile}</file>\n")
endforeach(FILE ${TOUCHUI_FILES})
file(APPEND ${CMAKE_CURRENT_BINARY_DIR}/application.qrc
        "</qresource></RCC>")
COPY_FILES(NATIVEDEPS ${CMAKE_SOURCE_DIR}/programs/touchui
    ${CMAKE_CURRENT_BINARY_DIR}/www ${TOUCHUI_FILES})
COPY_FILES(NATIVEDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}/www scripts.js)
COPY_FILES(NATIVEDEPS ${CMAKE_SOURCE_DIR}/programs/touchui
    ${CMAKE_CURRENT_BINARY_DIR}/www index.html)
QT4_ADD_RESOURCES(NATIVEQTCLIENT_RES
    ${CMAKE_CURRENT_BINARY_DIR}/application.qrc)

add_custom_target(nativeQtClientDepencencies DEPENDS ${NATIVEDEPS})

# creates a copy of the compiled webodf.js in the nativeQtClient build dir
add_custom_target(nativeQtClient-webodf.js-target
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js ${CMAKE_CURRENT_BINARY_DIR}/www
)
add_dependencies(nativeQtClient-webodf.js-target webodf.js-target)

add_executable(nativeQtClient EXCLUDE_FROM_ALL
    main.cpp
    odfview.cpp
    ../qtjsruntime/nativeio.cpp
    odfpage.cpp ${NATIVEQTCLIENT_MOC} ${NATIVEQTCLIENT_UI}
    ${NATIVEQTCLIENT_RES})

target_link_libraries(nativeQtClient ${QT_LIBRARIES})
add_dependencies(nativeQtClient nativeQtClient-webodf.js-target nativeQtClientDepencencies)
