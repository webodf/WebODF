COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR} 
    index.html
    editor.js 
    editor.css
    widgets.js
    widgets/paragraphStyles.js )
COPY_FILES(EDITORDEPS ${CMAKE_SOURCE_DIR}/webodf
    ${CMAKE_CURRENT_BINARY_DIR} webodf.css ${LIBJSFILES})
add_custom_target(editorDepencencies ALL DEPENDS ${EDITORDEPS})
