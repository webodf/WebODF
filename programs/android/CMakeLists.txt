set(ANDROID_JAR ${ANDROID_SDK_DIR}/platforms/android-8/android.jar)
file(GLOB_RECURSE ANDROID_RES_FILES ${CMAKE_CURRENT_SOURCE_DIR}/res/*)
file(GLOB_RECURSE ANDROID_JAVA_FILES ${CMAKE_CURRENT_SOURCE_DIR}/src/*.java)

# copy the webodf files into the resource directory

# generate gen/org/webodf/R.java
file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/gen/org/webodf)
add_custom_command(
        OUTPUT gen/org/webodf/R.java
        COMMAND ${ANDROID_SDK_DIR}/platform-tools/aapt
        ARGS package -f
             -M ${CMAKE_CURRENT_SOURCE_DIR}/AndroidManifest.xml
             -F webodf.apk
             -I ${ANDROID_JAR}
             -S ${CMAKE_CURRENT_SOURCE_DIR}/res/ -m
             -J ${CMAKE_CURRENT_BINARY_DIR}/gen/
        DEPENDS ${ANDROID_RES_FILES}
)
# compile java files
file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/bin)
add_custom_command(
        OUTPUT bin/org/webodf/R.class
	COMMAND ${Java_JAVAC_EXECUTABLE}
            -d ${CMAKE_CURRENT_BINARY_DIR}/bin/
            -cp ${ANDROID_JAR}
            ${ANDROID_JAVA_FILES} gen/org/webodf/R.java
        DEPENDS ${ANDROID_JAVA_FILES}
                ${CMAKE_CURRENT_BINARY_DIR}/gen/org/webodf/R.java
)
# generate a dex file
add_custom_command(
        OUTPUT bin/classes.dex
        COMMAND ${ANDROID_SDK_DIR}/platform-tools/dx
        ARGS --dex --output=bin/classes.dex
             ${CMAKE_CURRENT_BINARY_DIR}/bin/
        DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/bin/org/webodf/R.class
)
# pack everything in an apk

add_custom_target(android ALL DEPENDS bin/classes.dex)
#add_dependencies(android androidcompile)
