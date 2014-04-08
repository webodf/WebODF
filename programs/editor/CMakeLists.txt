COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    # general
    Editor.js
    editor.css
    Tools.js
    avatar-joe.png
    EditorSession.js
    Translator.js
    # only local editor
    FileSaver.js
    localeditor.js
    localeditor.html
    # only collab editor
    SessionListView.js
    MemberListView.js
    collabeditor.html
    collabeditor.js
    document-save.png
    network-disconnect.png
    vcs-locally-modified.png
    # example data
    welcome.odt
    # demo-only
    index.html
)

add_custom_target(more-editor-deps-target
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/server/ server/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/resources/ resources/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/translations/ translations/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/widgets/ widgets/
)

# creates a copy of the compiled webodf.js in the editor build dir
add_custom_target(editor-webodf.js-target
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js .
)
add_dependencies(editor-webodf.js-target webodf.js-target)


SET(DOJO_DEPS ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps)

add_custom_command(
    OUTPUT dojo-amalgamation.js

    # from our sources
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/dojo-deps/ dojo-deps/

    # from dojo download (DEPENDS Dojo)
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojo/ dojo-deps/src/dojo/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dijit/ dojo-deps/src/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/dojox/ dojo-deps/src/dojox/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${DOJO}/util/ dojo-deps/src/util/

    # now do the dojo magic...
    COMMAND ${NODE} ${DOJO_DEPS}/src/dojo/dojo.js load=build
        --require ${DOJO_DEPS}/src/app/run.js
        --profile ${DOJO_DEPS}/profiles/app.profile.js
        --releaseDir ${DOJO_DEPS}/dist

    COMMAND ${CMAKE_COMMAND} -E make_directory dojo/

    COMMAND ${CMAKE_COMMAND} -E copy dojo-deps/dist/dojo/dojo.js dojo/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojo/resources/ dojo/resources/

    COMMAND ${CMAKE_COMMAND} -E make_directory app/resources/
    COMMAND ${CMAKE_COMMAND} -E copy dojo-deps/dist/app/resources/app.css app/resources/

    COMMAND ${CMAKE_COMMAND} -E make_directory dojo-deps/dist/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dijit/themes/ dijit/themes/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dijit/icons/ dijit/icons/

    COMMAND ${CMAKE_COMMAND} -E make_directory dojo-deps/dist/dojox/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojox/layout/resources/ dojox/layout/resources/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo-deps/dist/dojox/widget/ColorPicker/ dojox/widget/ColorPicker/

    COMMAND ${NODE} ${CMAKE_SOURCE_DIR}/webodf/tools/dojoNlsCompile.js dojo-deps/dist de ru > dojobundle.js

    COMMAND ${NODE} ${CMAKE_CURRENT_SOURCE_DIR}/libexec/mergeIntoDojo.js dojobuild=${DOJO_DEPS}/dist/dojo/dojo.js dojobundle.js > dojo-amalgamation.js

    # cleanup
    # COMMAND ${CMAKE_COMMAND} -E remove_directory dojo-deps/dist

    DEPENDS ${NODE} Dojo
)

add_custom_target(editor-compiled.js-target DEPENDS dojo-amalgamation.js editor-webodf.js-target ${EDITORDEPS} more-editor-deps-target)
