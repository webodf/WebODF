#include "odfcontainer.h"
#include <quazip/quazip.h>
#include <quazip/quazipfile.h>
#include <QtCore/QDebug>

namespace {
    QString readzipfile(QuaZip* quazip, const char* name) {
        quazip->setCurrentFile(name, QuaZip::csSensitive);
        QuaZipFile file(quazip);
        file.open(QIODevice::ReadOnly);
        QByteArray data = file.readAll();
        return QString::fromUtf8(data); // assume utf8 for now
    }
}

OdfContainer::OdfContainer(const QUrl& u, QObject* parent) :QObject(parent), url(u)
{
    quazip = new QuaZip(u.toLocalFile());
    quazip->open(QuaZip::mdUnzip);
}

OdfContainer::~OdfContainer() {
    delete quazip;
}

QString
OdfContainer::getContentXml() {
    return readzipfile(quazip, "content.xml");
}

QString
OdfContainer::getStylesXml() {
    return readzipfile(quazip, "styles.xml");
}
