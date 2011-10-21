# the files that go into the extension
set(FIREFOXEXTENSIONFILES
    bootstrap.js
    install.rdf
    chrome.manifest
    skin/default/icon.png
    content/odf.html
    components/odfContentHandler.js
)
message(${CMAKE_CURRENT_SOURCE_DIR})
add_custom_command(
    OUTPUT webodf.xpi
    COMMAND echo ARGS ${CMAKE_CURRENT_SOURCE_DIR}
    # copy the common webodf.css and webodf.js
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_CURRENT_SOURCE_DIR}/content/webodf.css
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_SOURCE_DIR}/content/webodf.js
    # zip using javascript code running in node.js
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js packextension.js
        ${CMAKE_CURRENT_BINARY_DIR}/webodf.xpi
        ${FIREFOXEXTENSIONFILES}
        content/webodf.js
        content/webodf.css
    DEPENDS NodeJS
        packextension.js ${FIREFOXEXTENSIONFILES}
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_SOURCE_DIR}/webodf/webodf.js
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)
add_custom_target(firefoxextension ALL DEPENDS webodf.xpi)
