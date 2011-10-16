if(QT4_FOUND)
  add_subdirectory(qtjsruntime)
  add_subdirectory(nativeQtClient)
  add_subdirectory(docnosis)
endif(QT4_FOUND)

if(ANDROID_SDK_DIR)
  add_subdirectory(android)
endif(ANDROID_SDK_DIR)

add_subdirectory(firefoxextension)
