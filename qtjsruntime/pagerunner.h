#ifndef PAGERUNNER_H
#define PAGERUNNER_H

#include "nam.h"
#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtWebKit/QWebElement>
#include <QtGui/QApplication>
#include <QtGui/QPainter>
#include <QtGui/QPrinter>
#include <QtCore/QTextStream>
#include <QtCore/QTimer>
#include <QtCore/QTime>

class PageRunner : public QWebPage {
Q_OBJECT
private:
    NAM* nam;
    QTextStream out;
    QTextStream err;
    bool changed;
    QWidget* const view;
    QTime time;
public:
    PageRunner(const QString& url)
            : QWebPage(0),
              nam(new NAM(QUrl(url).host(), QUrl(url).port(), this)),
              out(stdout),
              err(stderr),
              view(new QWidget()) {
        setNetworkAccessManager(nam);
        mainFrame()->load(url);
        connect(this, SIGNAL(loadFinished(bool)), this, SLOT(finished()));
        setView(view);
    }
    ~PageRunner() {
        delete view;
    }
public slots:
    void finished() {
        connect(this, SIGNAL(contentsChanged()), this, SLOT(noteChange()));
        connect(this, SIGNAL(downloadRequested(QNetworkRequest)),
                this, SLOT(noteChange()));
        connect(this, SIGNAL(repaintRequested(QRect)),
                this, SLOT(noteChange()));
        connect(mainFrame(), SIGNAL(pageChanged()), this, SLOT(noteChange()));
        connect(this, SIGNAL(geometryChangeRequested(QRect)),
                this, SLOT(noteChange()));
        QTimer::singleShot(150, this, SLOT(reallyFinished()));
        changed = false;
        time.start();
    }
    void noteChange() {
        changed = true;
    }
    void reallyFinished() {
        int latency = time.restart();
        // err << latency << " " << changed << " " << nam->hasOutstandingRequests() << endl;
        if (changed || latency >= 152 || nam->hasOutstandingRequests()) {
            QTimer::singleShot(150, this, SLOT(reallyFinished()));
            changed = false;
            return;
        }
        QWebElement span
            = mainFrame()->documentElement().findAll("span").last();

        // save to bitmap
        setViewportSize(mainFrame()->contentsSize());
        renderToFile("render.png");
        printToFile("render.pdf");
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
    void renderToFile(const QString& filename) {
        QImage pixmap(mainFrame()->contentsSize().boundedTo(QSize(10000,10000)),
                QImage::Format_ARGB32_Premultiplied);
        QPainter painter(&pixmap);
        mainFrame()->render(&painter, QWebFrame::ContentsLayer);
        painter.end();
        pixmap.save(filename);
    }
    void printToFile(const QString& filename) {
        QPrinter printer(QPrinter::HighResolution);
        printer.setOutputFormat(QPrinter::PdfFormat);
        printer.setOutputFileName(filename);
        mainFrame()->print(&printer);
    }
    // overload because default impl was causing a crash
    QString userAgentForUrl(const QUrl&) const {
        return QString();
    } 
};

#endif
