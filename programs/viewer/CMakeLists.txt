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

# create zip file
set (VIEWER_ZIP ${CMAKE_BINARY_DIR}/viewer-${WEBODF_VERSION}.zip)
add_custom_command(
	OUTPUT ${VIEWER_ZIP}
    
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/images images
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/viewer.css viewer.css
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js webodf.js
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/viewer-minimized.js viewer.js
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/index.html index.html
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/README-viewer.odt README-viewer.odt

	# zip using javascript code running in node.js
	COMMAND ${NODE} ARGS ${RUNTIME} ${TOOLS}/zipper.js
		${VIEWER_ZIP}
		${VIEWER_IMAGES}
		index.html
		# let's not put the amalgamation in zip until it at
		# least includes css as well...
		# viewer-amalgamation.html
		README-viewer.odt
		webodf.js
		viewer.js
		viewer.css

    DEPENDS NodeJS
        ${TOOLS}/zipper.js
        ${VIEWER_IMAGES}
        viewer.css
        webodf.js-target
        viewer-minimized.js-target
        index.html
        README-viewer.odt
        viewer-amalgamation.html-target
)
add_custom_target(programs_viewer ALL DEPENDS ${VIEWER_ZIP})
