
FILE( GLOB_RECURSE TESTS_TESTFILES RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
	${CMAKE_CURRENT_SOURCE_DIR}/manifest.json
	${CMAKE_CURRENT_SOURCE_DIR}/tests.js
	${CMAKE_CURRENT_SOURCE_DIR}/tests.html
	${CMAKE_CURRENT_SOURCE_DIR}/utf8.txt
	${CMAKE_CURRENT_SOURCE_DIR}/*/*.js
	${CMAKE_CURRENT_SOURCE_DIR}/*/*.xml
	${CMAKE_CURRENT_SOURCE_DIR}/*/*.zip
	${CMAKE_CURRENT_SOURCE_DIR}/*/*.odt
	${CMAKE_CURRENT_SOURCE_DIR}/*/*.fodt
   	)

COPY_FILES(tests_nodetests ${CMAKE_CURRENT_SOURCE_DIR}
	${CMAKE_CURRENT_BINARY_DIR}/_nodetest ${TESTS_TESTFILES} )
add_custom_target(nodetest ALL
	COMMAND ${NODE} ${RUNTIMEJS} tests.js
	WORKING_DIRECTORY _nodetest
    DEPENDS ${tests_nodetests}
)
add_dependencies(nodetest ${NODE} manifest.json-target)

if (QT4_FOUND)
	COPY_FILES(tests_qtjsruntimetest ${CMAKE_CURRENT_SOURCE_DIR}
		${CMAKE_CURRENT_BINARY_DIR}/_qtjsruntimetest ${TESTS_TESTFILES} )
    COPY_FILES(tests_qtjsruntimetest2 ${CMAKE_CURRENT_SOURCE_DIR}/..
        ${CMAKE_CURRENT_BINARY_DIR} webodf.css)
	add_custom_target(qtjsruntimetest ALL
		COMMAND qtjsruntime ${RUNTIMEJS} tests.js
		WORKING_DIRECTORY _qtjsruntimetest
		DEPENDS ${tests_qtjsruntimetest} ${tests_qtjsruntimetest2}
	)
    add_dependencies(qtjsruntimetest ${NODE} qtjsruntime manifest.json-target)
endif (QT4_FOUND)

