#include "odfview.h"

#include "odfcontainer.h"
#include "odf.h"
#include "zipnetworkreply.h"

#include <QtCore/QByteArray>
#include <QtWebKit/QWebFrame>
#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkRequest>
#include <QtNetwork/QNetworkReply>
#include <QtCore/QFileInfo>
#include <QtCore/QDir>
#include <QtCore/QDebug>

class OdfView::OdfNetworkAccessManager : public QNetworkAccessManager {
private:
    QDir dir;
    QDir odfdir;
    QStringList allowedFiles;
    OdfContainer *currentFile;
public:
    OdfNetworkAccessManager(const QDir& localdir) :dir(localdir) {
        allowedFiles << "odf.html" << "style2css.js" << "defaultodfstyle.css"
                << "qtodf.js";
    }
    QNetworkReply* createRequest(Operation op, const QNetworkRequest& req,
                                 QIODevice* data = 0) {
        if (req.url().scheme() == "odfkit") {
            //data is inside the current zip file
            qDebug() << "zip! " << req.url();
            return new ZipNetworkReply(this, currentFile, req, op);
        }

        QNetworkRequest r(req);
        QString path;
        if (dir.absolutePath().startsWith(":")) {
            path = req.url().toString().mid(3);
        } else {
            path = req.url().toLocalFile();
        }
        QFileInfo fileinfo = path;
        if (op != GetOperation
                || !allowedFiles.contains(fileinfo.fileName())
                || fileinfo.dir() != dir) {
            // changing the url seems to be the only easy way to deny
            // requests
            qDebug() << "deny " << req.url();
            r.setUrl(QUrl("error:not-allowed"));
        }
        return QNetworkAccessManager::createRequest(op, r, data);
    }
    void setCurrentFile(OdfContainer *file) {currentFile = file;}
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

OdfView::OdfView(QWidget* parent) :QWebView(parent)
{
    setPage(new OdfPage(this));
    odf = new Odf(page()->mainFrame(), this);
    connect(page(), SIGNAL(loadFinished(bool)), this, SLOT(slotLoadFinished(bool)));
    page()->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()),
            this, SLOT(slotInitWindowObjects()));

    // use our own networkaccessmanager that gives limited access to the local
    // file system
    QString prefix = "../webodf";
    QString htmlfile = prefix + "/odf.html";
    if (!QFileInfo(htmlfile).exists()) {
        prefix = ":/";
        htmlfile = "qrc:/odf.html";
    }
    networkaccessmanager = new OdfNetworkAccessManager(QDir(prefix));
    page()->setNetworkAccessManager(networkaccessmanager);
    setUrl(QUrl(htmlfile));
    loaded = false;
}

OdfView::~OdfView() {
}

void
OdfView::slotInitWindowObjects()
{
    QWebFrame *frame = page()->mainFrame();
    frame->addToJavaScriptWindowObject("qtodf", odf);
}

bool
OdfView::loadFile(const QString &fileName) {
    curFile = fileName;
    identifier = QString::number(qrand());
    odf->addFile(identifier, fileName);
    networkaccessmanager->setCurrentFile(odf->getOpenContainer(identifier));
    if (loaded) {
        slotLoadFinished(true);
    }
    return true;
}

void
OdfView::slotLoadFinished(bool ok) {
    if (!ok) return;
    loaded = true;
    QWebFrame *frame = page()->mainFrame();
    QString js = "window.odfcontainer = new window.odf.OdfContainer('"
                 + identifier + "'); refreshOdf();";
    QVariant out = frame->evaluateJavaScript(js);
    qDebug() << out;
}

#include "moc_odfview.cpp"
