#include "odf.h"
#include "odfcontainer.h"
#include <QtCore/QFile>
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
    QFile file(path);
    file.open(QIODevice::ReadOnly);
    filedata[containerid] = file.readAll();
    file.close();
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
QString
Odf::read(QString containerid, int offset, int length) {
    const QByteArray& data = filedata[containerid];
    QString out(length, 0);
    if (length + offset > data.length()) {
        length = data.length() - offset;
    }
    for (int i = 0; i < length; ++i) {
        out[i] = data[i+offset];
    }
    return out;
}
int
Odf::getFileSize(QString containerid) {
    return filedata[containerid].length();
}
