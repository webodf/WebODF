#include "odf.h"
#include "odfcontainer.h"
#include <QtCore/QDebug>
#include <QtWebKit/QWebFrame>

OdfContainer* Odf::getContainer(const QString& url) {
    return new OdfContainer(url, this);
}

OdfContainer* Odf::getOpenContainer(const QString& id) {
    return openfiles.value(id);
}

void
Odf::addFile(const QString& containerid, const QString& path)
{
    if (!openfiles.contains(containerid)) {
        openfiles.insert(containerid, new OdfContainer(path, this));
    }
}

QString
Odf::load(QString containerid, QString path, QString callbackid)
{
    OdfContainer* c = openfiles.value(containerid);
    QString result;
    if (c) {
        result = c->loadAsString(path);
    }
    if (!callbackid.isNull()) {
        callbackdata = result;
        // call the callback with escaped result data
        QVariant out = frame->evaluateJavaScript("window.qtodf." + callbackid
                + "(window.qtodf.callbackdata);window.qtodf." + callbackid
                +"=null;");
        if (out.toString().length()) {
            qDebug() << out.toString();
        }
        callbackdata = QString();
    }
    return result;
}
