
#include "mainwindow.h"
#include "odftohtmlconverter.h"
#include <QtGui/QApplication>
#include <QtCore/QTimer>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);

    if (argc == 4 && strcmp(argv[1], "--tohtml") == 0) {
        OdfToHtmlConverter converter;// = new OdfToHtmlConverter(&a);
        a.connect(&converter, SIGNAL(conversionFinished()),
                  SLOT(quit()));
        converter.convertToHtml(argv[2], argv[3]);

        int timeout = 50000; // ms
        if (timeout > 0) {
            QTimer* timer = new QTimer(&a);
            a.connect(timer, SIGNAL(timeout()), SLOT(quit()));
            timer->setSingleShot(true);
            timer->start(timeout);
        }

        return a.exec();
    }

    MainWindow w;
    w.show();
    for (int i=1; i<argc; ++i) {
        w.openFile(argv[i]);
    }
    return a.exec();
}
