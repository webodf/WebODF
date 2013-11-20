COPY_FILES(BENCHMARK_HTML ${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR}
    1page.odt
    10pages.odt
    100pages.odt
    1000pages.odt
    index.html
)

FILE(GLOB BENCHMARK_JS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}/js" "${CMAKE_CURRENT_SOURCE_DIR}/js/*.js")

FOREACH(JSFILE ${BENCHMARK_JS})
  set(BENCHMARK_CLOSURE_ARGS ${BENCHMARK_CLOSURE_ARGS} --js ${JSFILE})
ENDFOREACH(JSFILE)

SET(BENCHMARK_JS_OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/benchmark.js")

add_custom_command(
  OUTPUT benchmark.js-target

  # from webodf.js target (DEPENDS webodf.js)
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js ${CMAKE_CURRENT_BINARY_DIR}

  # The transformed AMD modules take their names from the relative path supplied
  # To ensure these are predictable, the initial compilation must be done from the JS source directory
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/js
  COMMAND ${Java_JAVA_EXECUTABLE}
  ARGS -jar ${CLOSURE_JAR}
     ${BENCHMARK_CLOSURE_ARGS}
     --transform_amd_modules
     --process_common_js_modules
     --common_js_entry_module=HTMLBenchmark.js
     --formatting PRETTY_PRINT
     --js_output_file "${BENCHMARK_JS_OUTPUT}-"

  COMMAND ${CMAKE_COMMAND} ARGS -E rename "${BENCHMARK_JS_OUTPUT}-" "${BENCHMARK_JS_OUTPUT}"

  DEPENDS ClosureCompiler webodf.js-target
)

add_custom_target(html-benchmark DEPENDS benchmark.js-target ${BENCHMARK_HTML})