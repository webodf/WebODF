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

    //the name of the file within the zip, mid(2) removes the './'
    QString fileName = req.url().toString(QUrl::RemoveScheme);
    if (fileName.startsWith("./")) {
        fileName = fileName.mid(2);
    }

    m_file = odf->getFile(fileName, this);
    m_file->open(QIODevice::ReadOnly);
    qint64 fileSize = m_file->size();
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
    qint64 read = m_file->read(data, maxSize);
    if (read > 0) {
        m_remaining -= read;
    }
    return read;
}

qint64 ZipNetworkReply::bytesAvailable() const
{
    return m_remaining + QNetworkReply::bytesAvailable();
}

qint64 ZipNetworkReply::size() const
{
    return m_file->size();
}


