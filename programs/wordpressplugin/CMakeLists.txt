configure_file(webodf-viewer.php.in ${CMAKE_CURRENT_BINARY_DIR}/webodf-viewer.php)

add_custom_command(
    OUTPUT ${WORDPRESSZIP}
	COMMAND ${CMAKE_COMMAND} -E remove_directory ${WORDPRESSZIPDIR}
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${VIEWERBUILDDIR} ${WORDPRESSZIPDIR}/wv
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/readme.txt ${WORDPRESSZIPDIR}
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/webodf-viewer.php ${WORDPRESSZIPDIR}
    # zip using javascript code running in node.js
    COMMAND ${NODE} ARGS ../../webodf/lib/runtime.js ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/tools/zipdir.js
        ${WORDPRESSZIPDIR}
        ${WORDPRESSZIP}
        notopdir
    DEPENDS NodeJS
        ../../webodf/tools/zipdir.js
        readme.txt
        ${CMAKE_CURRENT_BINARY_DIR}/webodf-viewer.php
        viewerbuilddir-target
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
)
add_custom_target(wordpress-target DEPENDS ${WORDPRESSZIP})

