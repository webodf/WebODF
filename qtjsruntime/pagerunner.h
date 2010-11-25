#ifndef PAGERUNNER_H
#define PAGERUNNER_H

#include "nam.h"
#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtWebKit/QWebElement>
#include <QtGui/QApplication>
#include <QtGui/QPainter>
#include <QtGui/QPrinter>
#include <QtCore/QTemporaryFile>
#include <QtCore/QTextStream>
#include <QtCore/QTimer>
#include <QtCore/QTime>

class PageRunner : public QWebPage {
Q_OBJECT
private:
    QUrl url;
    NAM* nam;
    QTextStream out;
    QTextStream err;
    bool changed;
    QWidget* const view;
    QTime time;
    bool scriptMode;
public:
    PageRunner(const QStringList& arguments)
            : QWebPage(0),
              url(arguments[0]),
              nam(new NAM(QUrl(url).host(), QUrl(url).port(), this)),
              out(stdout),
              err(stderr),
              view(new QWidget()) {
        setNetworkAccessManager(nam);
        connect(this, SIGNAL(loadFinished(bool)), this, SLOT(finished()));
        setView(view);
        scriptMode = arguments[0].endsWith(".js");
        if (scriptMode) {
            QByteArray html = "'" + arguments[0].toUtf8().replace('\'', "\\'")
                    + "'";
            for (int i = 1; i < arguments.length(); ++i) {
                html += ",'" + arguments[i].toUtf8().replace('\'', "\\'") + "'";
            }
            html = "<html>"
                "<head><base href=\".\"></base><title></title></head><body>"
                "<script src=\"../lib/runtime.js\"></script>"
                "<script>var arguments=[" + html + "];</script>"
                "<script src=\"" + arguments[0].toUtf8() + "\"></script>"
                "</body></html>\n";
            QTemporaryFile tmp("XXXXXX.html");
            tmp.setAutoRemove(false);
            tmp.open();
            tmp.write(html);
            tmp.close();
            mainFrame()->load(tmp.fileName());
        } else {
            mainFrame()->load(url);
        }
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
        if (scriptMode) {
            qApp->exit(0);
        } else {
            QWebElement span
                = mainFrame()->documentElement().findAll("span").last();

            // save to bitmap
            setViewportSize(mainFrame()->contentsSize());
            renderToFile("render.png");
            printToFile("render.pdf");
            qApp->exit(0);
        }
    }
private:
    void javaScriptConsoleMessage(const QString& message, int lineNumber,
            const QString& sourceID) {
        changed = true;
        if (scriptMode) {
            err << message << endl;
        } else {
            err << sourceID << ":" << lineNumber << " " << message << endl;
        }
    }
    void javaScriptAlert(QWebFrame* /*frame*/, const QString& msg) {
        changed = true;
        err << "ALERT: " << msg << endl;
    }
    bool shouldInterruptJavaScript() {
        changed = true;
        return false;
    }
    bool javaScriptPrompt(QWebFrame*, const QString&, const QString&, QString*){
        changed = true;
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
