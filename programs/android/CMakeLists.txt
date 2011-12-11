set(ANDROID_JAR ${ANDROID_SDK_DIR}/platforms/android-8/android.jar)
file(GLOB_RECURSE ANDROID_RES_FILES ${CMAKE_CURRENT_SOURCE_DIR}/res/*)
file(GLOB_RECURSE ANDROID_ASSETS_FILES ${CMAKE_CURRENT_SOURCE_DIR}/res/*)
file(GLOB_RECURSE ANDROID_SRC_FILES ${CMAKE_CURRENT_SOURCE_DIR}/res/*)

set(WEBODFAPK ${CMAKE_CURRENT_BINARY_DIR}/bin/WebODF-debug.apk)
add_custom_command(
    OUTPUT ${WEBODFAPK}
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/res
        ${CMAKE_CURRENT_BINARY_DIR}/res
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/src
        ${CMAKE_CURRENT_BINARY_DIR}/src
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/assets
        ${CMAKE_CURRENT_BINARY_DIR}/assets
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_CURRENT_SOURCE_DIR}/AndroidManifest.xml
        ${CMAKE_CURRENT_BINARY_DIR}
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_CURRENT_BINARY_DIR}/assets/webodf.css
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_SOURCE_DIR}/webodf/embedodf.html
        ${CMAKE_CURRENT_BINARY_DIR}/assets/embedodf.html
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
        ${CMAKE_CURRENT_BINARY_DIR}/assets/webodf.js
    COMMAND ${ANDROID_SDK_DIR}/tools/android
        ARGS update project --path . --target android-7 --name WebODF
    COMMAND ${ANT} ARGS debug
    COMMAND ${ANT} ARGS release
    DEPENDS AndroidManifest.xml ${ANDROID_RES_FILES}
        ${ANDROID_ASSETS_FILES} ${ANDROID_SRC_FILES}
        ${CMAKE_SOURCE_DIR}/webodf/webodf.css
        ${CMAKE_SOURCE_DIR}/webodf/embedodf.html
        ${CMAKE_BINARY_DIR}/webodf/webodf.js
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
)
add_custom_target(apk ALL DEPENDS ${WEBODFAPK})
