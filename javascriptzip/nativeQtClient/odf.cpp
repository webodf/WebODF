#include "odf.h"
#include "odfcontainer.h"
#include <QtCore/QDebug>
#include <QtWebKit/QWebFrame>

OdfContainer* Odf::getContainer(const QString& url) {
    return new OdfContainer(url, this);
}

void
Odf::addFile(const QString& containerid, const QString& path)
{
    if (!openfiles.contains(containerid)) {
        openfiles.insert(containerid, new OdfContainer(path, this));
    }
}

QString
Odf::load(QString containerid, QString path, QString odfcontainerid)
{
    OdfContainer* c = openfiles.value(containerid);
    QString result;
    if (c) {
        result = c->loadAsString(path);
    }
    // TODO: call the callback with escaped result data
    // frame->evaluateJavaScript("window.qtodf."+odfcontainerid+".callback("+result+");")
    return result;
}
