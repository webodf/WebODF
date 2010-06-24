#include <QtGui/QApplication>
#include "mainwindow.h"

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;
    w.show();
    for (int i=1; i<argc; ++i) {
        w.openFile(argv[i]);
    }
    return a.exec();
}
