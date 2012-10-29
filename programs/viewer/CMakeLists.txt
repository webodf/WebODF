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
# (write js code into into viewer.html)
set (VIEWER_MERGED_HTML viewer-amalgamation.html)
add_custom_command(
	OUTPUT ${VIEWER_MERGED_HTML}
	COMMAND ${NODE} ARGS ${RUNTIME} ${TOOLS}/replaceByFileContents.js
		${CMAKE_CURRENT_SOURCE_DIR}/index-amalgamation-template.html
		${VIEWER_MERGED_HTML}
		@VIEWER_JS@ ${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
		@WEBODF_JS@ ${CMAKE_BINARY_DIR}/webodf/webodf.js
    DEPENDS NodeJS ${TOOLS}/replaceByFileContents.js
        webodf.js
        ${CMAKE_CURRENT_SOURCE_DIR}/index-amalgamation-template.html
)

# create zip file
set (VIEWER_ZIP ${CMAKE_BINARY_DIR}/viewer-${WEBODF_VERSION}.zip)
add_custom_command(
	OUTPUT ${VIEWER_ZIP}
    
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/images images
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/viewer.css viewer.css
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js webodf.js
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js viewer.js
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/index.html index.html

	# zip using javascript code running in node.js
	COMMAND ${NODE} ARGS ${RUNTIME} ${TOOLS}/zipper.js
		${VIEWER_ZIP}
		${VIEWER_IMAGES}
		index.html
		# let's not put the amalgamation in zip until it at
		# least includes css as well...
		# ${VIEWER_MERGED_HTML}
		webodf.js
		viewer.js
		viewer.css

    DEPENDS NodeJS
		${TOOLS}/replaceByFileContents.js ${VIEWER_IMAGES}
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
		${VIEWER_MERGED_HTML}
		${CMAKE_CURRENT_SOURCE_DIR}/index.html
		${CMAKE_CURRENT_SOURCE_DIR}/viewer.css
		${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
		${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js
)
add_custom_target(programs_viewer ALL DEPENDS ${VIEWER_MERGED_HTML} ${VIEWER_ZIP})

# minimize js code
add_custom_command(
	OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js
	COMMAND ${Java_JAVA_EXECUTABLE}
	ARGS -jar ${CLOSURE_JAR}
	${SHARED_CLOSURE_ARGS}
	--js ${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
	--compilation_level SIMPLE_OPTIMIZATIONS
	--js_output_file ${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js
	DEPENDS ClosureCompiler ${CMAKE_CURRENT_SOURCE_DIR}/viewer.js
	)
add_custom_target(viewer-minimized.js)


