#ifndef ZIPNETWORKREPLY_H
#define ZIPNETWORKREPLY_H

#include <QNetworkReply>

class OdfContainer;

class ZipNetworkReply : public QNetworkReply
{
Q_OBJECT
public:
    ZipNetworkReply(QObject* parent, OdfContainer *odf, const QNetworkRequest &req, const QNetworkAccessManager::Operation op);

    void close();
    void abort();
    qint64 bytesAvailable() const;
    qint64 size() const;

protected:
    qint64 readData(char *data, qint64 maxSize) ;

private:
    QIODevice *m_file;
    qint64 m_remaining;
};

#endif // ODF_H
