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


add_custom_target(editorDepencencies ALL DEPENDS ${EDITORDEPS})
