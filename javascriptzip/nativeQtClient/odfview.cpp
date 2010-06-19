#include "odfview.h"
#include <QtCore/QByteArray>
#include <QtWebKit/QWebFrame>
#include <QtWebKit/QWebInspector>
#include "odfcontainer.h"
#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkRequest>
#include <QtNetwork/QNetworkReply>
#include <QtCore/QFileInfo>
#include <QtCore/QDir>
#include <QtCore/QDebug>

class OdfView::OdfNetworkAccessManager : public QNetworkAccessManager {
private:
    class DummyNetworkReply : public QNetworkReply {
    public:
        DummyNetworkReply(QNetworkAccessManager* parent) :QNetworkReply(parent) {
        }
    private:
        void abort() {
            qDebug() << "abort called";
        }
        qint64 readData(char*, qint64) {
            qDebug()<<"read...";return -1;
            setError(QNetworkReply::ContentAccessDenied, tr("Access denied."));
        }
    };
    QDir dir;
    QDir odfdir;
    QStringList allowedFiles;
public:
    OdfNetworkAccessManager(const QDir& localdir) :dir(localdir) {
        allowedFiles << "odf.html" << "style2css.js" << "defaultodfstyle.css";
    }
    QNetworkReply* createRequest(Operation op, const QNetworkRequest& req,
                                 QIODevice* data = 0) {
        QNetworkRequest r(req);
        QFileInfo fileinfo = req.url().toLocalFile();
        if (op != GetOperation
                || !allowedFiles.contains(fileinfo.fileName())
                || fileinfo.dir() != dir) {
            // changing the url seems to be the only easy way to deny
            // requests
            r.setUrl(QUrl("error:not-allowed"));
        }
        return QNetworkAccessManager::createRequest(op, r, data);
    }
};

namespace {
    class OdfPage : public QWebPage {
    public:
        OdfPage(QObject* parent) :QWebPage(parent) {}
        void javaScriptConsoleMessage(const QString& message, int lineNumber, const QString & sourceID) {
            qDebug() << message;
        }
    };
}

OdfView::OdfView()
{
    odfcontainer = 0;
    setPage(new OdfPage(this));
    connect(page(), SIGNAL(loadFinished(bool)), this, SLOT(slotLoadFinished(bool)));
    page()->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    //QWebInspector *inspector = new QWebInspector(this);
    //inspector->setPage(page());

    // use our own networkaccessmanager that gives limited access to the local
    // file system
    networkaccessmanager = new OdfNetworkAccessManager(QDir(".."));
    page()->setNetworkAccessManager(networkaccessmanager);

    // for now, we simply point to the file, we want to read
    setUrl(QUrl("../odf.html"));
    loaded = false;
}

OdfView::~OdfView() {
}

bool
OdfView::loadFile(const QString &fileName) {
    odfcontainer = new OdfContainer(fileName, this);
    if (loaded) {
        slotLoadFinished(true);
    }
    return true;
}

void
OdfView::slotLoadFinished(bool ok) {
    if (!ok) return;
    QWebFrame *frame = page()->mainFrame();
    frame->addToJavaScriptWindowObject("odf", odfcontainer);
    frame->evaluateJavaScript("refreshOdf();");
}

#include "moc_odfview.cpp"
