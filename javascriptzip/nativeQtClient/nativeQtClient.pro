# -------------------------------------------------
# Project created by QtCreator 2010-06-17T17:22:51
# -------------------------------------------------
QT += network \
    script \
    scripttools \
    webkit \
    xml \
    xmlpatterns \
    testlib
TARGET = nativeQtClient
INCLUDEPATH += /usr/include/minizip
RESOURCES     = ../application.qrc
LIBS += -lquazip
TEMPLATE = app
SOURCES += main.cpp \
    mainwindow.cpp \
    odfview.cpp \
    odfcontainer.cpp \
    odf.cpp
HEADERS += mainwindow.h \
    odfview.h \
    odfcontainer.h \
    odf.h
FORMS += mainwindow.ui
