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
    OUTPUT ${FIREFOX_EXTENSION_ODFVIEWER}
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${FIREFOX_EXTENSION_ODFVIEWER_DIR}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${FIREFOX_EXTENSION_ODFVIEWER_DIR}/content/web
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/install.rdf ${FIREFOX_EXTENSION_ODFVIEWER_DIR}
    COMMAND ${NODE} ARGS ${RUNTIMEJS} ${TOOLS_DIR}/replaceByFileContents.js
        ${CMAKE_CURRENT_SOURCE_DIR}/content/web/viewer.html.in
        ${FIREFOX_EXTENSION_ODFVIEWER_DIR}/content/web/viewer.html
        @WEBODF_JS@ ${CMAKE_BINARY_DIR}/webodf/webodf.js
    COMMAND ${NODE} ARGS ${RUNTIMEJS}  packextension.js
        ${FIREFOX_EXTENSION_ODFVIEWER_DIR}
        ${FIREFOXEXTENSIONFILES}
    COMMAND ${NODE} ARGS ${RUNTIMEJS} ${TOOLS_DIR}/zipdir.js
        ${FIREFOX_EXTENSION_ODFVIEWER_DIR}
        ${FIREFOX_EXTENSION_ODFVIEWER}
        notopdir
    DEPENDS ${NODE}
        ${TOOLS_DIR}/replaceByFileContents.js
        ${TOOLS_DIR}/zipdir.js
        packextension.js
        ${FIREFOXEXTENSIONFILES}
        webodf.js-target
        content/web/viewer.html.in
        ${CMAKE_CURRENT_BINARY_DIR}/install.rdf
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)

add_custom_target(build-firefoxextension DEPENDS ${FIREFOX_EXTENSION_ODFVIEWER})

add_custom_target(test-firefoxextension DEPENDS webodf.js-tests)

add_custom_target(product-firefoxextension DEPENDS build-firefoxextension test-firefoxextension)
