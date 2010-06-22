#include "odfcontainer.h"
#include <quazip/quazip.h>
#include <quazip/quazipfile.h>
#include <QtCore/QDebug>
#include <QtCore/QTime>

namespace {
    QString readzipfile(QuaZip* quazip, const QString& name) {
        QTime now = QTime::currentTime();
        quazip->setCurrentFile(name, QuaZip::csSensitive);
        QuaZipFile file(quazip);
        file.open(QIODevice::ReadOnly);
        QByteArray data = file.readAll();
        QString result = QString::fromUtf8(data); // assume utf8 for now
        qDebug() << "Unzip time: " << now.elapsed() << " ms";
        return result;
    }
}

OdfContainer::OdfContainer(const QUrl& u, QObject* parent) :QObject(parent), url_(u)
{
    quazip = new QuaZip(u.toLocalFile());
    quazip->open(QuaZip::mdUnzip);
}

OdfContainer::~OdfContainer() {
    delete quazip;
}

QString
OdfContainer::loadAsString(const QString& path)
{
    return readzipfile(quazip, path);
}
