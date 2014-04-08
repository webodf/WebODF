set(TOUCHUI_FILES
  app/app.js
  app/controller/Files.js
  app/model/FileSystem.js
  app/views/FileDetail.js
  app/views/FilesList.js
  app/views/OdfView.js
  app/views/Viewport.js
  sencha-touch.css
  sencha-touch.js
  app/store/FileStore.js
  ZoomOut.png
  ZoomIn.png
  go-previous.png
  go-next.png
  zoom-fit-width.png
  zoom-fit-best.png
  zoom-fit-height.png
  PARENT_SCOPE
)

COPY_FILES(TOUCHUIDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR} ${TOUCHUI_FILES})
COPY_FILES(TOUCHUIDEPS ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR} index.html scripts.js welcome.odt)
add_custom_target(touchuiDepencencies ALL DEPENDS ${TOUCHUIDEPS})
