# the files that go into the extension
set(FIREFOXEXTENSIONFILES
    bootstrap.js
    chrome.manifest
    skin/default/icon.png
    content/web/viewer.html
    components/OdfStreamConverter.js
)
configure_file(${CMAKE_CURRENT_SOURCE_DIR}/install.rdf.in
    ${CMAKE_CURRENT_SOURCE_DIR}/install.rdf)
set(WEBODFXPI ${CMAKE_CURRENT_BINARY_DIR}/webodf-${WEBODF_VERSION}.xpi)

# write webodf.js into viewer.html
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/content/web/viewer.html
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js makeViewerHtml.js
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
    DEPENDS NodeJS
        webodf.js
        ${CMAKE_CURRENT_SOURCE_DIR}/content/web/viewer.html.in
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)

add_custom_command(
    OUTPUT ${WEBODFXPI}
    # zip using javascript code running in node.js
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js packextension.js
        ${WEBODFXPI}
        ${FIREFOXEXTENSIONFILES}
        install.rdf
    DEPENDS NodeJS
        packextension.js ${FIREFOXEXTENSIONFILES}
        install.rdf.in
        content/web/viewer.html
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)
add_custom_target(programs_firefoxextension ALL DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/content/web/viewer.html ${WEBODFXPI})
# alias target:
add_custom_target(firefoxextension DEPENDS programs_firefoxextension)
