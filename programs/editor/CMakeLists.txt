COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    collabeditor.html
    collabeditor.js
    welcome.odt
    FileSaver.js
    localeditor.js
    localeditor.html
    index.html
    Editor.js
    editor.css
    Tools.js
    avatar-joe.png
    EditorSession.js
    SessionListView.js
    MemberListView.js
    Translator.js
)

COPY_FILES(EDITORDEPS_webodf ${CMAKE_SOURCE_DIR}/webodf
    ${CMAKE_CURRENT_BINARY_DIR} ${LIBJSFILES})

SET(DOJO_DEPS ${CMAKE_CURRENT_BINARY_DIR}/dojo-deps)

add_custom_command(
    OUTPUT dojo-amalgamation.js

    # from our sources
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/server/ server/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/resources/ resources/
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/translations/ translations/
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
    COMMAND ${CMAKE_COMMAND} -E make_directory translations/

    COMMAND ${NODE} ${CMAKE_CURRENT_SOURCE_DIR}/libexec/mergeIntoDojo.js dojobuild=${DOJO_DEPS}/dist/dojo/dojo.js dojobundle.js > dojo-amalgamation.js

    # cleanup
    # COMMAND ${CMAKE_COMMAND} -E remove_directory dojo-deps/dist

	DEPENDS NodeJS ${EDITORDEPS} ${EDITORDEPS_webodf} Dojo webodf.js-target
)

add_custom_target(editor-compiled.js-target DEPENDS dojo-amalgamation.js)
