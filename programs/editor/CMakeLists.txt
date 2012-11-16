COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR} 
    index.html
    editor.js 
    editor.css
    widgets.js
    avatar-joe.png
    EditorSession.js )

COPY_FILES(EDITORDEPS ${CMAKE_SOURCE_DIR}/webodf
    ${CMAKE_CURRENT_BINARY_DIR} webodf.css ${LIBJSFILES})

file(COPY nls/ DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/nls)
file(COPY widgets/ DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/widgets)
file(COPY ${CMAKE_CURRENT_BINARY_DIR}/../../webodf/webodf.js DESTINATION ${CMAKE_CURRENT_BINARY_DIR})

file(COPY dojo-deps/ DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps)
file(COPY ${DOJO}/dojo DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/src/)
file(COPY ${DOJO}/dijit DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/src/)
file(COPY ${DOJO}/dojox DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/src/)
file(COPY ${DOJO}/util DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/src/)

add_custom_target(editorDepencencies ALL DEPENDS ${EDITORDEPS})

execute_process(COMMAND ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/build.sh)