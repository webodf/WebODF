#include "odfview.h"

#include "../qtjsruntime/nativeio.h"
#include "../qtjsruntime/nam.h"

#include "odfpage.h"

#include <QtCore/QByteArray>
#include <QtWebKit/QWebFrame>
#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkRequest>
#include <QtNetwork/QNetworkReply>
#include <QtCore/QFileInfo>
#include <QtCore/QDir>

OdfView::OdfView(QWidget* parent) :QWebView(parent)
{
    QString prefix = "../android/assets/"; // set this to the right value when debugging
    QString htmlfile = QDir(prefix).absoluteFilePath("www/index.html");
    qDebug() << "HELLO";
    if (!QFileInfo(htmlfile).exists()) {
        qDebug() << "HELLO";
        prefix = "qrc:/";
        htmlfile = "qrc:/www/index.html";
    }
    setPage(new OdfPage(this));
    nativeio = new NativeIO(this, QDir(prefix), QDir::current());
    connect(page(), SIGNAL(loadFinished(bool)), this, SLOT(slotLoadFinished(bool)));
    page()->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()),
            this, SLOT(slotInitWindowObjects()));

    // use our own networkaccessmanager that gives limited access to the local
    // file system
    networkaccessmanager = new NAM(this);
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
    frame->addToJavaScriptWindowObject("nativeio", nativeio);
}

bool
OdfView::loadFile(const QString &fileName) {
    curFile = fileName;
    //    odf->addFile(identifier, fileName);
    //    networkaccessmanager->setCurrentFile(odf->getOpenContainer(identifier));
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
            "runtime.readFileSync = function (path, encoding) {"
            "    return nativeio.readFileSync(path, encoding);"
            "};"
            "runtime.read = function (path, offset, length, callback) {"
            "    var data = nativeio.read(path, offset, length);"
            "    data = runtime.byteArrayFromString(data, 'binary');"
            "    callback(nativeio.error()||null, data);"
            "};"
            "runtime.getFileSize = function (path, callback) {"
            "    callback(nativeio.getFileSize(path));"
            "};"
            "runtime.loadClass('odf.OdfCanvas');"
            "window.canvas = new odf.OdfCanvas(document.getElementById('odf'));"
            "window.canvas.load('" + curFile + "');";
    frame->evaluateJavaScript(js);
}
