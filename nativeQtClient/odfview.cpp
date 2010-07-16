#include "odfview.h"

#include "odfcontainer.h"
#include "odf.h"
#include "zipnetworkreply.h"

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

namespace {
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
