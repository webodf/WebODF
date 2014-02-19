SET(COMMON_EDITOR_FILES
    Tools.js
    avatar-joe.png
    EditorSession.js
    Translator.js
    FullWindowZoomHelper.js
    wodotexteditor.css
)
SET(ALONE_EDITOR_ONLY_FILES
    wodotexteditor.js
    FileSaver.js
    localfileeditor.js
    localeditor.html
    revieweditor.html
    images/kogmbh.png
    images/webodf.png
    texteditor.html
)
SET(COLLAB_EDITOR_ONLY_FILES
    SessionListView.js
    MemberListView.js
    collabeditor.html
    document-save.png
    network-disconnect.png
    vcs-locally-modified.png
    wodocollabpane.css
    wodocollabtexteditor.js
    pullboxeditor.js
)
SET(ALONE_EDITOR_EXAMPLE_FILES
    welcome.odt
)
SET(ALONE_EDITOR_FILES
    ${COMMON_EDITOR_FILES}
    ${ALONE_EDITOR_ONLY_FILES}
    ${ALONE_EDITOR_EXAMPLE_FILES}
)
COPY_FILES(EDITORDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    ${COMMON_EDITOR_FILES}
    ${ALONE_EDITOR_ONLY_FILES}
    ${COLLAB_EDITOR_ONLY_FILES}
    ${ALONE_EDITOR_EXAMPLE_FILES}
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

add_custom_command(
    OUTPUT ${WODOTEXTEDITORBUILDDIR}
    # clean up output dir
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${WODOTEXTEDITORBUILDDIR}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${WODOTEXTEDITORBUILDDIR}

    COMMAND ${CMAKE_COMMAND} -E copy webodf.js ${WODOTEXTEDITORBUILDDIR}

    COMMAND ${CMAKE_COMMAND} -E copy_directory resources/ ${WODOTEXTEDITORBUILDDIR}/resources/
    COMMAND ${CMAKE_COMMAND} -E copy_directory translations/ ${WODOTEXTEDITORBUILDDIR}/translations/
    COMMAND ${CMAKE_COMMAND} -E copy_directory widgets/ ${WODOTEXTEDITORBUILDDIR}/widgets/

    # dojo compiled
    COMMAND ${CMAKE_COMMAND} -E copy dojo-amalgamation.js ${WODOTEXTEDITORBUILDDIR}

    # more dojo (data) files
    COMMAND ${CMAKE_COMMAND} -E make_directory ${WODOTEXTEDITORBUILDDIR}/dojo
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojo/resources ${WODOTEXTEDITORBUILDDIR}/dojo/resources
    COMMAND ${CMAKE_COMMAND} -E copy_directory app/ ${WODOTEXTEDITORBUILDDIR}/app/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dijit/ ${WODOTEXTEDITORBUILDDIR}/dijit/
    COMMAND ${CMAKE_COMMAND} -E copy_directory dojox/ ${WODOTEXTEDITORBUILDDIR}/dojox/

    COMMAND ${CMAKE_COMMAND} -E copy ${LIBJSLICENSEFILE} ${WODOTEXTEDITORBUILDDIR}

    DEPENDS editor-compiled.js-target
)

foreach(AE_FILE ${ALONE_EDITOR_FILES})
    add_custom_command(
      OUTPUT ${WODOTEXTEDITORBUILDDIR}/${AE_FILE}
      COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${AE_FILE}
        ${WODOTEXTEDITORBUILDDIR}/${AE_FILE}
      DEPENDS
        ${AE_FILE} ${WODOTEXTEDITORBUILDDIR}
    )
    set(WODOTEXTEDITOR_BUILDFILES ${WODOTEXTEDITOR_BUILDFILES} ${WODOTEXTEDITORBUILDDIR}/${AE_FILE})
endforeach(AE_FILE)

add_custom_target(wodotexteditorbuilddir-target DEPENDS ${WODOTEXTEDITORBUILDDIR} ${WODOTEXTEDITOR_BUILDFILES})

# package wodotexteditor
set(WODOTEXTEDITOR_ZIP wodotexteditor-${WEBODF_VERSION}.zip)
add_custom_command(
    OUTPUT ${WODOTEXTEDITOR_ZIP}
    # zip using javascript code running in node.js
    COMMAND ${NODE} ARGS ${RUNTIMEJS} ${TOOLS_DIR}/zipdir.js
        ${WODOTEXTEDITORBUILDDIR}
        ${CMAKE_BINARY_DIR}/${WODOTEXTEDITOR_ZIP}
    DEPENDS
        wodotexteditorbuilddir-target
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
add_custom_target(product-wodotexteditor DEPENDS ${WODOTEXTEDITOR_ZIP})
