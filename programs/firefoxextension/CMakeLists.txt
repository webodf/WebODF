# the files that go into the extension
set(FIREFOXEXTENSIONFILES
    bootstrap.js
    chrome.manifest
    skin/default/icon.png
    components/OdfStreamConverter.js
)
configure_file(install.rdf.in ${CMAKE_CURRENT_BINARY_DIR}/install.rdf)

# write webodf.js into viewer.html
add_custom_command(
    OUTPUT ${WEBODFXPI}
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${WEBODFXPIDIR}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${WEBODFXPIDIR}/content/web
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/install.rdf ${WEBODFXPIDIR}
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js makeViewerHtml.js
        ${CMAKE_CURRENT_BINARY_DIR}/../../webodf/webodf.js
        ${WEBODFXPIDIR}/content/web/viewer.html
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js packextension.js
        ${WEBODFXPIDIR}
        ${FIREFOXEXTENSIONFILES}
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/tools/zipdir.js
        ${WEBODFXPIDIR}
        ${WEBODFXPI}
        notopdir
    DEPENDS NodeJS
        makeViewerHtml.js
        packextension.js
        ${FIREFOXEXTENSIONFILES}
        webodf.js-target
        content/web/viewer.html.in
        ${CMAKE_CURRENT_BINARY_DIR}/install.rdf
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)

add_custom_target(firefoxextension-target DEPENDS ${WEBODFXPI})
