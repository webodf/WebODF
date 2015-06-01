COPY_FILES(BENCHMARK_HTML ${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR}
    1page.odt
    10pages.odt
    100pages.odt
    1000pages.odt
    index.html
    runner.css
)

FILE(GLOB BENCHMARK_JS "${CMAKE_CURRENT_SOURCE_DIR}/js/*.js")

FOREACH(JSFILE ${BENCHMARK_JS})
  set(BENCHMARK_CLOSURE_ARGS ${BENCHMARK_CLOSURE_ARGS} --js ${JSFILE})
ENDFOREACH(JSFILE)

add_custom_command(
  OUTPUT benchmark.js-target

  # from webodf.js target (DEPENDS webodf.js)
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_BINARY_DIR}/webodf/webodf.js ${CMAKE_CURRENT_BINARY_DIR}

  COMMAND ${Java_JAVA_EXECUTABLE}
  ARGS -jar ${CLOSURE_JAR}
     ${BENCHMARK_CLOSURE_ARGS}
     --transform_amd_modules
     --process_common_js_modules
     --common_js_entry_module HTMLBenchmark.js
     --common_js_module_path_prefix ${CMAKE_CURRENT_SOURCE_DIR}/js/
     --compilation_level SIMPLE_OPTIMIZATIONS
     --formatting PRETTY_PRINT
     --js_output_file "benchmark.js-"

  COMMAND ${CMAKE_COMMAND} ARGS -E rename "benchmark.js-" "benchmark.js"

  DEPENDS ClosureCompiler webodf.js-target
)

add_custom_target(html-benchmark DEPENDS benchmark.js-target ${BENCHMARK_HTML})
