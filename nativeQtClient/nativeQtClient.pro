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
RESOURCES = ../webodf/application.qrc
LIBS += -lquazip
TEMPLATE = app
SOURCES += main.cpp \
    mainwindow.cpp \
    zipnetworkreply.cpp \
    odfview.cpp \
    odfcontainer.cpp \
    odf.cpp \
    odfnetworkaccessmanager.cpp \
    odfpage.cpp \
    odftohtmlconverter.cpp
HEADERS += mainwindow.h \
    zipnetworkreply.h \
    odfview.h \
    odfcontainer.h \
    odf.h \
    odfnetworkaccessmanager.h \
    odfpage.h \
    odftohtmlconverter.h
FORMS += mainwindow.ui
