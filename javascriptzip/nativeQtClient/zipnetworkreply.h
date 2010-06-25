#ifndef ZIPNETWORKREPLY_H
#define ZIPNETWORKREPLY_H

#include <QNetworkReply>

class OdfContainer;

class ZipNetworkReply : public QNetworkReply
{
Q_OBJECT
public:
    ZipNetworkReply(QObject* parent, const QNetworkRequest &req, const QNetworkAccessManager::Operation op);

    void abort();
protected:
    qint64 readData(char *data, qint64 maxSize) ;
private:
    OdfContainer *zipFile;
};

#endif // ODF_H
