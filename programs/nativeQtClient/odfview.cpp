#include "odfview.h"

#include "odfcontainer.h"
#include "odf.h"

#include "odfpage.h"
#include "odfnetworkaccessmanager.h"

#include <QtCore/QByteArray>
#include <QtWebKit/QWebFrame>
#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkRequest>
#include <QtNetwork/QNetworkReply>
#include <QtCore/QFileInfo>
#include <QtCore/QDir>
#include <QtCore/QDebug>

OdfView::OdfView(QWidget* parent) :QWebView(parent)
{
    QString prefix = "../../webodf/"; // set this to the right value when debugging
    QString htmlfile = QDir(prefix).absoluteFilePath("embedodf.html");
    qDebug() << htmlfile;
    if (!QFileInfo(htmlfile).exists()) {
        prefix = ":/";
        htmlfile = "qrc:/embedodf.html";
    }
    setPage(new OdfPage(this));
    odf = new Odf(page()->mainFrame(), prefix, this);
    connect(page(), SIGNAL(loadFinished(bool)), this, SLOT(slotLoadFinished(bool)));
    page()->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()),
            this, SLOT(slotInitWindowObjects()));

    // use our own networkaccessmanager that gives limited access to the local
    // file system
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
    QString js =
        "runtime.readFileSync = function(path) {"
        "    return qtodf.readFileSync(path);"
        "};"
        "runtime.read = function(path, offset, length, callback) {"
        "    var data = qtodf.read(path, offset, length);"
        "    data = runtime.byteArrayFromString(data, 'binary');"
        "    callback(null, data);"
        "};"
        "runtime.getFileSize = function(path, callback) {"
        "    callback(qtodf.getFileSize(path));"
        "};"
        "runtime.loadClass('odf.OdfCanvas');"
        "window.canvas = new odf.OdfCanvas(document.getElementById('odf'));"
        "window.canvas.load('" + identifier + "');";
    frame->evaluateJavaScript(js);
}
