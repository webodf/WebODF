#include "odfview.h"
#include <QtCore/QByteArray>

OdfView::OdfView()
{
}

bool
OdfView::loadFile(const QString &fileName) {
    QByteArray content = "<b>"+fileName.toUtf8()+"</b>";
    setContent(content);
    return true;
}

#include "moc_odfview.cpp"
