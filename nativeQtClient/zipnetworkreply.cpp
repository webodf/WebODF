//TODO gpl?

#include "zipnetworkreply.h"

#include "odfcontainer.h"

#include <QtCore/QDebug>

ZipNetworkReply::ZipNetworkReply(QObject* parent, OdfContainer *odf, const QNetworkRequest &req, const QNetworkAccessManager::Operation op)
    :QNetworkReply(parent)
{
    setRequest(req);
    setUrl(req.url());
    setOperation(op);
    QNetworkReply::open(QIODevice::ReadOnly);

    //the name of the file within the zip
    QString fileName = req.url().toString(QUrl::RemoveScheme);
    qDebug() << fileName;

    m_file = odf->getFile(fileName, this);
    m_file->open(QIODevice::ReadOnly);
    qint64 fileSize = m_file->size();
    qDebug() << fileSize;
    m_remaining = fileSize;
    
    //setHeader(QNetworkRequest::LastModifiedHeader, fi.lastModified());
    setHeader(QNetworkRequest::ContentLengthHeader, fileSize);

    QMetaObject::invokeMethod(this, "metaDataChanged", Qt::QueuedConnection);
    QMetaObject::invokeMethod(this, "downloadProgress", Qt::QueuedConnection,
            Q_ARG(qint64, fileSize), Q_ARG(qint64, fileSize));
    QMetaObject::invokeMethod(this, "readyRead", Qt::QueuedConnection);
    QMetaObject::invokeMethod(this, "finished", Qt::QueuedConnection);

}

void ZipNetworkReply::close()
{
    QNetworkReply::close();
    m_file->close();
}

void ZipNetworkReply::abort()
{
    QNetworkReply::close();
    m_file->close();
}

qint64 ZipNetworkReply::readData(char *data, qint64 maxSize)
{
    qDebug() << "reading " << maxSize;
    qint64 read = m_file->read(data, maxSize);
    qDebug() << "read " << read;
    if (read > 0) {
        m_remaining -= read;
    }
    return read;
}

qint64 ZipNetworkReply::bytesAvailable() const
{
    qDebug() << "avail " << m_remaining << " + " << QNetworkReply::bytesAvailable();
    return m_remaining + QNetworkReply::bytesAvailable();
}

qint64 ZipNetworkReply::size() const
{
    qDebug() << "size " << m_file->size();
    return m_file->size();
}


