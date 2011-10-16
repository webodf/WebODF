# jar is used to zip
add_custom_command(
  COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_CURRENT_BINARY_DIR}/content
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_SOURCE_DIR}/webodf/webodf.css
    ${CMAKE_CURRENT_BINARY_DIR}/content/webodf.css
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_SOURCE_DIR}/webodf/webodf.js
    ${CMAKE_CURRENT_BINARY_DIR}/content/webodf.js
  COMMAND ${Java_JAR_EXECUTABLE}
    cMf ${CMAKE_CURRENT_BINARY_DIR}/webodf.xpi
    bootstrap.js install.rdf chrome.manifest content/odf.html
    components/odfContentHandler.js
    -C ${CMAKE_CURRENT_BINARY_DIR} content/webodf.js
    -C ${CMAKE_CURRENT_BINARY_DIR} content/webodf.css
  OUTPUT webodf.xpi
  DEPENDS bootstrap.js install.rdf chrome.manifest content/odf.html
    components/odfContentHandler.js
    ${CMAKE_SOURCE_DIR}/webodf/webodf.css
    ${CMAKE_SOURCE_DIR}/webodf/webodf.js
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)
add_custom_target(firefoxextension ALL DEPENDS webodf.xpi)
