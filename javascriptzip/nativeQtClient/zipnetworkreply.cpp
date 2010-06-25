#include "zipnetworkreply.h"
#include <QtCore/QDebug>

ZipNetworkReply::ZipNetworkReply(QObject* parent, const QNetworkRequest &req, const QNetworkAccessManager::Operation op)
    :QNetworkReply(parent),
    zipFile(0)
{
    setRequest(req);
    setUrl(req.url());
    setOperation(op);
    open(QIODevice::ReadOnly);

    //the name of the file within the zip
    qDebug() << req.url().toString(QUrl::RemoveScheme);

    //TODO get real data
    int fileSize = 0;
    
    //setHeader(QNetworkRequest::LastModifiedHeader, fi.lastModified());
    setHeader(QNetworkRequest::ContentLengthHeader, fileSize);

    QMetaObject::invokeMethod(this, "metaDataChanged", Qt::QueuedConnection);
    QMetaObject::invokeMethod(this, "downloadProgress", Qt::QueuedConnection,
            Q_ARG(qint64, fileSize), Q_ARG(qint64, fileSize));
    QMetaObject::invokeMethod(this, "readyRead", Qt::QueuedConnection);
    QMetaObject::invokeMethod(this, "finished", Qt::QueuedConnection);

}

void ZipNetworkReply::abort()
{
    QNetworkReply::close();
}

qint64 ZipNetworkReply::readData(char *data, qint64 maxSize)
{
    //TODO
    qDebug() << "foo!";
    return -1;
}


