#ifndef PAGERUNNER_H
#define PAGERUNNER_H

#include <QtCore/QTextStream>
#include <QtCore/QDebug>
#include <QtGui/QApplication>
#include <QtNetwork/QNetworkReply>
#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtWebKit/QWebElement>

class NAM : public QNetworkAccessManager {
private:
    const QString host;
    const int port;
public:
    NAM(const QString& host_, int port_) :host(host_), port(port_) {}
    QNetworkReply* createRequest(QNetworkAccessManager::Operation o,
            QNetworkRequest const& r, QIODevice* d) {
        if (r.url().host() != host || r.url().port() != port) {
            // if not same host and port, block
            return QNetworkAccessManager::createRequest(o, QNetworkRequest(),
                    d);
        }
        return QNetworkAccessManager::createRequest(o, r, d);
    }
};

class PageRunner : public QObject {
Q_OBJECT
private:
    QWebPage* webpage;
    QNetworkAccessManager* nam;
public:
    PageRunner(const QString& url)
            : webpage(new QWebPage(this)),
              nam(new NAM(QUrl(url).host(), QUrl(url).port())) {
        webpage->setNetworkAccessManager(nam);
        webpage->mainFrame()->load(url);
        connect(webpage, SIGNAL(loadFinished(bool)), this, SLOT(finished()));
    }
public slots:
    void finished() {
        QWebElement span
            = webpage->mainFrame()->documentElement().findAll("span").last();
        QTextStream out(stdout);
        out << span.toInnerXml();
        qApp->exit(0);
    }
};

#endif
