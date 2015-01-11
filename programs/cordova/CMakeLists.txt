
configure_file(config.xml.in config.xml)
configure_file(manifest.webapp.in manifest.webapp)

#set(CORDOVA_FILES WebODF/config.xml)

# install cordova in the top level node_modules directory
set(CORDOVA ${CMAKE_BINARY_DIR}/node_modules/cordova/bin/cordova)
add_custom_command(
    OUTPUT ${CORDOVA}
    COMMAND ${NPM} ARGS install cordova@3.5
    DEPENDS copy_node_modules
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
)
# create a project folder for WebODF cordova
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/WebODF/hooks/README.md
    COMMAND ${CMAKE_COMMAND} ARGS -E remove_directory ${CMAKE_CURRENT_BINARY_DIR}/WebODF
    COMMAND ${CORDOVA} create WebODF org.webodf WebODF --copy-from ${CMAKE_CURRENT_SOURCE_DIR}/www
    DEPENDS ${CORDOVA}
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
)
# add the desired plugins
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/org.apache.cordova.file/plugin.xml
    COMMAND ${CORDOVA} plugins add org.apache.cordova.file
    COMMAND ${CORDOVA} plugins add ${CMAKE_CURRENT_SOURCE_DIR}/plugins/org.webodf.starturl
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/WebODF/hooks/README.md
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
)
# add the android platforms to the WebODF cordova folder
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/android.json
    COMMAND ${CORDOVA} platform add android
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/org.apache.cordova.file/plugin.xml
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
)
# add the firefoxos platforms to the WebODF cordova folder
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/firefoxos.json
    COMMAND ${CORDOVA} platform add firefoxos
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/org.apache.cordova.file/plugin.xml
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
)
add_custom_command(
    OUTPUT WebODF/merges/config.xml
    COMMAND ${CMAKE_COMMAND} ARGS -E remove_directory ${CMAKE_CURRENT_BINARY_DIR}/WebODF/www
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/www ${CMAKE_CURRENT_BINARY_DIR}/WebODF/www
    COMMAND ${CMAKE_COMMAND} ARGS -E remove_directory ${CMAKE_CURRENT_BINARY_DIR}/WebODF/merges
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/merges ${CMAKE_CURRENT_BINARY_DIR}/WebODF/merges
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different ${CMAKE_CURRENT_BINARY_DIR}/config.xml ${CMAKE_CURRENT_BINARY_DIR}/WebODF/merges
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different ${CMAKE_CURRENT_BINARY_DIR}/manifest.webapp ${CMAKE_CURRENT_BINARY_DIR}/WebODF/merges/firefoxos/manifest.webapp
    COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different ${CMAKE_BINARY_DIR}/webodf/webodf.js ${CMAKE_CURRENT_BINARY_DIR}/WebODF/www/webodf.js
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/WebODF/hooks/README.md
            config.xml.in manifest.webapp.in
            webodf.js-target
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
)

if(BUILD_APK)
    # build the android apk
    add_custom_command(
        OUTPUT WebODF/platforms/android/ant-build/WebODF-debug.apk
        COMMAND ${CMAKE_COMMAND} ARGS -E copy_if_different
            ${CMAKE_CURRENT_SOURCE_DIR}/platforms/android/AndroidManifest.xml
            ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/android/AndroidManifest.xml
        COMMAND ${CMAKE_COMMAND} ARGS -E remove_directory ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/android/res/
        COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/platforms/android/res/ ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/android/res/
        COMMAND ${CMAKE_COMMAND} ARGS -E remove_directory ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/android/src/org/webodf/
        COMMAND ${CMAKE_COMMAND} ARGS -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/platforms/android/src/org/webodf/ ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/android/src/org/webodf/
        COMMAND ${CORDOVA} build android
        DEPENDS WebODF/merges/config.xml
                ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/android.json
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
    )
    add_custom_target(product-androidviewer DEPENDS WebODF/platforms/android/ant-build/WebODF-debug.apk)
endif()

# build the firefoxos package
add_custom_command(
    OUTPUT WebODF/platforms/firefoxos/build/package.zip
    COMMAND ${CORDOVA} build firefoxos
    COMMAND ${NODE} ARGS ${RUNTIMEJS} ${TOOLS_DIR}/zipdir.js
        ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/firefoxos/www/
        ${CMAKE_CURRENT_BINARY_DIR}/WebODF/platforms/firefoxos/build/package.zip
        notopdir
    DEPENDS WebODF/merges/config.xml
            ${CMAKE_CURRENT_BINARY_DIR}/WebODF/plugins/firefoxos.json
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/WebODF
)

add_custom_target(product-firefoxosviewer DEPENDS WebODF/platforms/firefoxos/build/package.zip)
