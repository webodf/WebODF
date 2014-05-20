add_subdirectory(touchui)

if(BUILD_QTJSRUNTIME)
  add_subdirectory(qtjsruntime)
#   add_subdirectory(nativeQtClient)
endif(BUILD_QTJSRUNTIME)

if(ANDROID AND ANT)
  add_subdirectory(android)
endif(ANDROID AND ANT)

add_subdirectory(docnosis)

add_subdirectory(firefoxextension)

add_subdirectory(playbook)
add_subdirectory(benchmark)
add_subdirectory(editor)
add_subdirectory(viewer)
