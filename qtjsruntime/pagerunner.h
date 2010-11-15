#ifndef PAGERUNNER_H
#define PAGERUNNER_H

#include <QtCore/QTextStream>
#include <QtGui/QApplication>
#include <QtGui/QPainter>
#include <QtGui/QPrinter>
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

class PageRunner : public QWebPage {
Q_OBJECT
private:
    QNetworkAccessManager* nam;
    QTextStream out;
    QTextStream err;
public:
    PageRunner(const QString& url)
            : QWebPage(0),
              nam(new NAM(QUrl(url).host(), QUrl(url).port())),
              out(stdout),
              err(stderr) {
        setNetworkAccessManager(nam);
        mainFrame()->load(url);
        connect(this, SIGNAL(loadFinished(bool)), this, SLOT(finished()));
    }
public slots:
    void finished() {
        QWebElement span
            = mainFrame()->documentElement().findAll("span").last();
        out << span.toInnerXml() << endl;

        // save to bitmap
        QWidget w;
        setView(&w);
        QPixmap pixmap(mainFrame()->contentsSize());
        render(pixmap);
        pixmap.save("render.png");
        print("render.pdf");

        qApp->exit(0);
    }
private:
    void javaScriptConsoleMessage(const QString& message, int lineNumber,
            const QString& sourceID) {
        err << sourceID << ":" << lineNumber << " " << message << endl;
    }
    void javaScriptAlert(QWebFrame* /*frame*/, const QString& msg) {
        err << "ALERT: " << msg << endl;
    }
    bool shouldInterruptJavaScript() {
        return false;
    }
    bool javaScriptPrompt(QWebFrame*, const QString&, const QString&, QString*){
        return false;
    }
    void render(QPixmap& pixmap) {
        setViewportSize(pixmap.size());
        QPainter painter(&pixmap);
        mainFrame()->render(&painter);
    }
    void print(const QString& filename) {
        QPrinter printer(QPrinter::HighResolution);
        printer.setOutputFormat(QPrinter::PdfFormat);
        printer.setOutputFileName(filename);
        mainFrame()->print(&printer);
    }
};

#endif
