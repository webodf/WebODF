# files for the viewer
set(VIEWER_IMAGES
	images/texture.png
	images/toolbarButton-download.png
	images/toolbarButton-fullscreen.png
	images/toolbarButton-menuArrows.png
	images/toolbarButton-pageDown.png
	images/toolbarButton-pageUp.png
	images/toolbarButton-zoomIn.png
	images/toolbarButton-zoomOut.png
)

set (TOOLS ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/tools)

# amalgamation:
# (write js code into into viewer-amalgamation.html)
add_custom_command(
	OUTPUT viewer-amalgamation.html
	COMMAND ${NODE} ARGS ${RUNTIME} ${TOOLS}/replaceByFileContents.js
		${CMAKE_CURRENT_SOURCE_DIR}/index-amalgamation-template.html
		viewer-amalgamation.html
		@VIEWER_JS@ ${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
		@WEBODF_JS@ ${CMAKE_BINARY_DIR}/webodf/webodf.js
    DEPENDS NodeJS ${TOOLS}/replaceByFileContents.js
        viewer.js
        webodf.js-target
        index-amalgamation-template.html
)
add_custom_target(viewer-amalgamation.html-target DEPENDS viewer-amalgamation.html)

# minimize js code
add_custom_command(
	OUTPUT viewer-minimized.js
	COMMAND ${Java_JAVA_EXECUTABLE}
	ARGS -jar ${CLOSURE_JAR}
	${SHARED_CLOSURE_ARGS}
	--js ${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
	--compilation_level SIMPLE_OPTIMIZATIONS
	--js_output_file ${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js
	DEPENDS ClosureCompiler viewer.js
	)
add_custom_target(viewer-minimized.js-target DEPENDS viewer-minimized.js)
