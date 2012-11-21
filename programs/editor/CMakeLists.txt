COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    index.html
    editor.js
    editor.css
    widgets.js
    avatar-joe.png
    EditorSession.js
)

COPY_FILES(EDITORDEPS ${CMAKE_SOURCE_DIR}/webodf
    ${CMAKE_CURRENT_BINARY_DIR} webodf.css ${LIBJSFILES})

add_custom_command(
    OUTPUT editor-compiled.js # still phony

    # from our sources
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/nls/ nls/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/widgets/ widgets/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/dojo-deps/ dojo-deps/

    # from dojo download (DEPENDS Dojo)
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojo/ dojo-deps/src/dojo/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dijit/ dojo-deps/src/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojox/ dojo-deps/src/dojox/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/util/ dojo-deps/src/util/

    # from webodf.js target (DEPENDS webodf.js)
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js .

    # now do the dojo magic...
    COMMAND ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps/build.sh

    COMMAND ${CMAKE_COMMAND} -E make_directory digest
    COMMAND ${CMAKE_COMMAND} -E make_directory digest/dojo/

    COMMAND ${CMAKE_COMMAND} -E copy dojo-deps/dist/dojo/dojo.js digest/dojo/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojo/resources/ digest/dojo/resources/

    COMMAND ${CMAKE_COMMAND} -E make_directory digest/app/resources/
    COMMAND ${CMAKE_COMMAND} -E copy dojo-deps/dist/app/resources/app.css digest/app/resources/

    COMMAND ${CMAKE_COMMAND} -E make_directory dojo-deps/dist/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dijit/themes/ digest/dijit/themes/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dijit/icons/ digest/dijit/icons/
    
    COMMAND ${CMAKE_COMMAND} -E make_directory dojo-deps/dist/dojox/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojox/layout/resources/ digest/dojox/layout/resources/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojox/widget/ColorPicker/ digest/dojox/widget/ColorPicker/

	COMMAND ${NODE} ${CMAKE_SOURCE_DIR}/webodf/tools/dojoNlsCompile.js dojo-deps/dist de ru > digest/custom-nls.js
    # cleanup
    # COMMAND ${CMAKE_COMMAND} -E remove_directory dojo-deps/dist

	DEPENDS NodeJS ${EDITORDEPS} Dojo webodf.js
)

add_custom_target(programs_editor ALL DEPENDS editor-compiled.js webodf.js)
