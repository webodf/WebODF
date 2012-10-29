if(QT4_FOUND)
  add_subdirectory(qtjsruntime)
  add_subdirectory(nativeQtClient)
  add_subdirectory(docnosis)
endif(QT4_FOUND)

if(ANDROID_SDK_DIR AND ANT)
  add_subdirectory(android)
endif(ANDROID_SDK_DIR AND ANT)

add_subdirectory(firefoxextension)

add_subdirectory(touchui)
add_subdirectory(playbook)
add_subdirectory(editor)
add_subdirectory(viewer)
add_subdirectory(wordpressplugin)
