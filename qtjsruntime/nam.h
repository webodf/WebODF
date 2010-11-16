#ifndef NAM_H
#define NAM_H

#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkRequest>
#include <QtCore/QDebug>

class NAM : public QNetworkAccessManager {
Q_OBJECT
private:
    const QString host;
    const int port;
    int outstandingRequests;
public:
    NAM(const QString& host_, int port_, QObject* parent)
            :QNetworkAccessManager(parent), host(host_), port(port_) {
        outstandingRequests = 0;
        connect(this, SIGNAL(finished(QNetworkReply*)),
                this, SLOT(requestFinished()));
    }
    QNetworkReply* createRequest(QNetworkAccessManager::Operation o,
            QNetworkRequest const& r, QIODevice* d) {
        outstandingRequests += 1;
        bool samehost = r.url().host() == host
                || r.url().host().endsWith("." + host)
                || host.endsWith("." + r.url().host());
        if (!samehost || r.url().port() != port) {
            // if not same host or domain and port, block
            return QNetworkAccessManager::createRequest(o, QNetworkRequest(),
                    d);
        }
        return QNetworkAccessManager::createRequest(o, r, d);
    }
    bool hasOutstandingRequests() {
        return outstandingRequests > 0;
    }
public slots:
    void requestFinished() {
        outstandingRequests -= 1;
    }
};
#endif
