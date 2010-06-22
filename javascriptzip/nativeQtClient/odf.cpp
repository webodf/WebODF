#include "odf.h"
#include "odfcontainer.h"
#include <QtCore/QDebug>

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
Odf::load(QString containerid, QString path, QVariant callback)
{
    OdfContainer* c = openfiles.value(containerid);
    if (!c) return QString();
    return c->loadAsString(path);
}
