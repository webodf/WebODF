include(${QT_USE_FILE})
include_directories(${CMAKE_CURRENT_BINARY_DIR} ${QT_QTCORE_INCLUDE_DIR})
include_directories(/usr/include/minizip)
QT4_WRAP_CPP(NATIVEQTCLIENT_MOC
    mainwindow.h
    zipnetworkreply.h
    odfview.h
    odfcontainer.h 
    odf.h
    odfnetworkaccessmanager.h
    odfpage.h)
QT4_WRAP_UI(NATIVEQTCLIENT_UI mainwindow.ui)
QT4_ADD_RESOURCES(NATIVEQTCLIENT_RES ../../webodf/application.qrc)
add_executable(nativeQtClient
    main.cpp
    mainwindow.cpp
    zipnetworkreply.cpp
    odfview.cpp
    odfcontainer.cpp
    odf.cpp
    odfnetworkaccessmanager.cpp
    odfpage.cpp ${NATIVEQTCLIENT_MOC} ${NATIVEQTCLIENT_UI}
    ${NATIVEQTCLIENT_RES})

target_link_libraries(nativeQtClient ${QT_LIBRARIES} quazip)
