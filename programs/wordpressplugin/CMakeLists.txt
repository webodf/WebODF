
set (RUNTIME ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/lib/runtime.js)
set (TOOLS ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/tools)

# create zip file
set (WP_ZIP webodf-for-wordpress-${WEBODF_VERSION}.zip)
set (VIEWER ${CMAKE_CURRENT_BINARY_DIR}/../viewer)

FILE( GLOB WP_VIEWER_IMAGES RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}/../viewer ${CMAKE_CURRENT_SOURCE_DIR}/../viewer/images/* )
FOREACH(img ${WP_VIEWER_IMAGES})
	LIST(APPEND WP_VIEWER_IMAGES_WVPREFIX wv/${img})
ENDFOREACH(img)

add_custom_command(
	OUTPUT ${WP_ZIP}
    
	COMMAND ${CMAKE_COMMAND} -E make_directory wv
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${VIEWER}/images wv/images
	COMMAND ${CMAKE_COMMAND} -E copy ${VIEWER}/index.html wv/index.html
	COMMAND ${CMAKE_COMMAND} -E copy ${VIEWER}/viewer.css wv/viewer.css
	COMMAND ${CMAKE_COMMAND} -E copy ${VIEWER}/webodf.js wv/webodf.js
	COMMAND ${CMAKE_COMMAND} -E copy ${VIEWER}/viewer.js wv/viewer.js
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/readme.txt readme.txt
	COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/webodf-viewer.php webodf-viewer.php


	# zip using javascript code running in node.js
	COMMAND ${NODE} ARGS ${RUNTIME} ${TOOLS}/zipper.js
		${WP_ZIP}
		# defined in ../viewer/CMakeLists.txt
		${WP_VIEWER_IMAGES_WVPREFIX}

		wv/index.html
		wv/viewer.css
		wv/webodf.js
		wv/viewer.js

		readme.txt
		webodf-viewer.php

    DEPENDS NodeJS
		${TOOLS}/replaceByFileContents.js
		${CMAKE_CURRENT_SOURCE_DIR}/readme.txt
		${CMAKE_CURRENT_SOURCE_DIR}/webodf-viewer.php
		# ${VIEWER/index.html}
		# ${VIEWER/viewer.css}
		# ${VIEWER/viewer.js}
		# ${VIEWER/webodf.js}
		programs_viewer
)
add_custom_target(programs_wordpressplugin ALL DEPENDS ${WP_ZIP})
# alias target:
add_custom_target(wordpressplugin DEPENDS programs_wordpressplugin)

