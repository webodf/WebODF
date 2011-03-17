
set(LIBJSFILES lib/packages.js lib/runtime.js lib/core/Base64.js lib/core/RawDeflate.js lib/core/ByteArray.js lib/core/ByteArrayWriter.js lib/core/RawInflate.js lib/core/Cursor.js lib/core/UnitTester.js lib/core/PointWalker.js lib/core/Async.js lib/core/Zip.js
    lib/gui/Caret.js lib/gui/SelectionMover.js lib/gui/XMLEdit.js
    lib/dom/LSSerializerFilter.js lib/dom/LSSerializer.js lib/dom/RelaxNG.js
    lib/odf/StyleInfo.js lib/odf/Style2CSS.js lib/odf/OdfContainer.js lib/odf/OdfCanvas.js)

set(TESTJSFILES tests/core/ZipTests.js
    tests/core/Base64Tests.js
    tests/core/PointWalkerTests.js
    tests/core/CursorTests.js
    tests/core/RuntimeTests.js
    tests/gui/XMLEditTests.js
    tests/gui/SelectionMoverTests.js
    tests/gui/CaretTests.js
    tests/tests.js
)

add_custom_target(jslintcheck ALL
    COMMAND ${NODE} lib/runtime.js tools/runjslint.js
        ${LIBJSFILES} ${TESTJSFILES}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    SOURCES ${LIBJSFILES}
)

if (CMAKE_Java_RUNTIME)

  set(SHARED_CLOSURE_ARGS --warning_level VERBOSE --formatting PRETTY_PRINT --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_error fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility)

  foreach(JSFILE ${LIBJSFILES} ${TESTJSFILES})
    set(SHARED_CLOSURE_ARGS ${SHARED_CLOSURE_ARGS}
        --js ${CMAKE_CURRENT_SOURCE_DIR}/${JSFILE})
  endforeach(JSFILE ${LIBJSFILES})

  add_custom_command(
    OUTPUT simplecompiled.js
    COMMAND ${CMAKE_Java_RUNTIME}
    ARGS -jar ${CLOSURE_JAR}
         ${SHARED_CLOSURE_ARGS}
         --compilation_level WHITESPACE_ONLY
         --js_output_file simplecompiled.js
    DEPENDS ${LIBJSFILES} ${TESTJSFILES}
  )

  add_custom_command(
    OUTPUT compiled.js
    COMMAND ${CMAKE_Java_RUNTIME}
    ARGS -jar ${CLOSURE_JAR}
         --define='IS_COMPILED_CODE=true'
         ${SHARED_CLOSURE_ARGS}
         --compilation_level ADVANCED_OPTIMIZATIONS
         --externs ${CMAKE_CURRENT_SOURCE_DIR}/tools/externs.js
         --js_output_file compiled.js
    DEPENDS ${LIBJSFILES} ${TESTJSFILES} tools/externs.js
  )

  add_custom_target(syntaxcheck ALL DEPENDS simplecompiled.js compiled.js)

  add_custom_target(rhinotest
  	COMMAND ${CMAKE_Java_RUNTIME} -jar ${RHINO}
          -debug lib/runtime.js tests/tests.js
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        SOURCES ${LIBJSFILES}
  )
  add_custom_target(simplerhinotest
  	COMMAND ${CMAKE_Java_RUNTIME} -jar ${RHINO}
        ${CMAKE_CURRENT_BINARY_DIR}/simplecompiled.js
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/tests
        DEPENDS simplecompiled.js
  )
  add_custom_command(
        OUTPUT docs/index.html
 	COMMAND ${CMAKE_Java_RUNTIME}
        ARGS -jar ${JSDOCDIR}/jsrun.jar
            ${JSDOCDIR}/app/run.js -d=${CMAKE_CURRENT_BINARY_DIR}/docs
                -t=${JSDOCDIR}/templates/jsdoc ${LIBJSFILES}
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        DEPENDS ${LIBJSFILES}
  )
  add_custom_target(doc DEPENDS docs/index.html)

endif (CMAKE_Java_RUNTIME)

add_custom_target(nodetest ALL
	COMMAND ${NODE} lib/runtime.js tests/tests.js
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        SOURCES ${LIBJSFILES}
)
add_custom_target(simplenodetest ALL
	COMMAND ${NODE} ${CMAKE_CURRENT_BINARY_DIR}/simplecompiled.js
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/tests
        DEPENDS simplecompiled.js
)
add_custom_command(
        OUTPUT instrumented/index.html
        COMMAND ${JSCOVERAGE}
        ARGS ${CMAKE_CURRENT_SOURCE_DIR}
             ${CMAKE_CURRENT_BINARY_DIR}/instrumented
        DEPENDS ${LIBJSFILES}
)
add_custom_target(instrumented ALL DEPENDS instrumented/index.html)
