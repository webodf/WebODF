#include "odfview.h"
#include <QtCore/QByteArray>
#include <QtWebKit/QWebFrame>
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
        DummyNetworkReply(QObject* parent) :QNetworkReply(parent) {}
    private:
        void abort() {}
        qint64 readData(char*, qint64) { return -1; }
    };
    QDir dir;
    QDir odfdir;
    QStringList allowedFiles;
public:
    OdfNetworkAccessManager(const QDir& localdir) :dir(localdir) {
        allowedFiles << "qtodf.html" << "style2css.js" << "defaultodfstyle.css";
    }
    QNetworkReply* createRequest(Operation op, const QNetworkRequest& req,
                                 QIODevice* data = 0) {
        if (op != GetOperation) return 0;
        QFileInfo fileinfo = req.url().toLocalFile();
        if (allowedFiles.contains(fileinfo.fileName()) && fileinfo.dir() == dir) {
            return QNetworkAccessManager::createRequest(op, req, data);
        }
        qDebug() << "not loading " << req.url();
        return new DummyNetworkReply(this);
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

    // use our own networkaccessmanager that gives limited access to the local
    // file system
    networkaccessmanager = new OdfNetworkAccessManager(QDir(".."));
    page()->setNetworkAccessManager(networkaccessmanager);

    // for now, we simply point to the file, we want to read
    setUrl(QUrl("../qtodf.html"));
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
    QVariant output = frame->evaluateJavaScript("refreshOdf();");
    qDebug() << output;
}

#include "moc_odfview.cpp"
