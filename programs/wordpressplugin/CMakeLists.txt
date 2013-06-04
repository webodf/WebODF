
set (RUNTIME ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/lib/runtime.js)
set (TOOLS ${CMAKE_CURRENT_SOURCE_DIR}/../../webodf/tools)

set (VIEWER ${CMAKE_CURRENT_BINARY_DIR}/../viewer)

FILE( GLOB WP_VIEWER_IMAGES RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}/../viewer ${CMAKE_CURRENT_SOURCE_DIR}/../viewer/images/* )
FOREACH(img ${WP_VIEWER_IMAGES})
	LIST(APPEND WP_VIEWER_IMAGES_WVPREFIX wv/${img})
ENDFOREACH(img)

add_custom_target(wordpressplugin DEPENDS programs_wordpressplugin)

