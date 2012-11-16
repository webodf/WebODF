COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    index.html
    editor.js
    editor.css
    widgets.js
    avatar-joe.png
    EditorSession.js
 
    dojo-deps/build.sh
    dojo-deps/src/app/run.js
 
)
 
COPY_FILES(EDITORDEPS ${CMAKE_SOURCE_DIR}/webodf
    ${CMAKE_CURRENT_BINARY_DIR} webodf.css ${LIBJSFILES})
 
 
add_custom_command(
    OUTPUT editor-compiled.js
 
 
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/nls/ nls/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/widgets/ widgets/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/dojo-deps/ dojo-deps/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojo/ dojo-deps/src/dojo/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dijit/ dojo-deps/src/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojox/ dojo-deps/src/dojox/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/util/ dojo-deps/src/util/
 
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js .
 
    COMMAND ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/build.sh
 
    DEPENDS ${EDITORDEPS} Dojo webodf.js
)
 
add_custom_target(programs_editor ALL DEPENDS editor-compiled.js webodf.js)
