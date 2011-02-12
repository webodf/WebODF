#include "odftohtmlconverter.h"
#include "odfnetworkaccessmanager.h"
#include "odf.h"
#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtWebKit/QWebElement>
#include <QtWebKit/QWebView>
#include <QtCore/QTimer>
#include <QtCore/QDebug>
#include <QtXml/QDomDocument>
#include <quazip/quazip.h>
#include <quazip/quazipfile.h>

OdfToHtmlConverter::OdfToHtmlConverter(QObject* parent) :QObject(parent)
{
}

void
OdfToHtmlConverter::convertToHtml(const QString& inputfile,
                                  const QString& outputfile)
{
    this->inputfile = inputfile;
    this->outputfile = outputfile;
    page = new QWebPage(this);
    odf = new Odf(page->mainFrame(), this);
    OdfNetworkAccessManager* networkaccessmanager = new OdfNetworkAccessManager(QDir(":/"));

    odf->addFile("0", inputfile);
    networkaccessmanager->setCurrentFile(odf->getOpenContainer("0"));
    page->setNetworkAccessManager(networkaccessmanager);
    page->mainFrame()->setUrl(QUrl("qrc:/odf.html"));
    connect(page, SIGNAL(loadFinished(bool)), SLOT(loadOdf()));
    connect(page->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()),
            this, SLOT(slotInitWindowObjects()));
}

void
OdfToHtmlConverter::slotInitWindowObjects()
{
    QWebFrame *frame = page->mainFrame();
    frame->addToJavaScriptWindowObject("qtodf", odf);
}

void
OdfToHtmlConverter::loadOdf()
{
    QWebFrame *frame = page->mainFrame();
    QString js = "window.odfcontainer = new window.odf.OdfContainer('0');"
                 "refreshOdf();";
    frame->evaluateJavaScript(js);

    timer = new QTimer(this);
    connect(timer, SIGNAL(timeout()), SLOT(periodicCheck()));
    timer->setSingleShot(false);
    timer->start(20);
}

void
OdfToHtmlConverter::periodicCheck()
{
    // check if the html body contains and odf element yet
    QWebFrame *frame = page->mainFrame();
    QWebElement element = frame->documentElement().firstChild();
    while (!element.isNull() && element.localName() != "body") {
        element = element.nextSibling();
    }
    element = element.firstChild();
    while (!element.isNull() && element.localName() != "document") {
        element = element.nextSibling();
    }
    if (element.localName() == "document") {
        timer->stop();
        serialize();
    }
}

void
OdfToHtmlConverter::serialize()
{
    QWebFrame *frame = page->mainFrame();

    // retrieve the css
    QFile defcss(":/defaultodfstyle.css");
    defcss.open(QIODevice::ReadOnly);
    QString css = QString::fromUtf8(defcss.readAll());
    defcss.close();

    QWebElement element = frame->documentElement().firstChild();
    while (!element.isNull() && element.localName() != "head") {
        element = element.nextSibling();
    }
    element = element.firstChild();
    while (!element.isNull()) {
        if (element.localName() == "style") {
            QString js = "var s='';for (var i=0; i<this.sheet.cssRules.length;i++){s+=this.sheet.cssRules.item(i).cssText;};s;";
            css +=  element.evaluateJavaScript(js).toString() + "\n";
        }
        element = element.nextSibling();
    }

    QuaZip* quazip = new QuaZip(inputfile);
    quazip->open(QuaZip::mdUnzip);
    QuaZipFile* content = new QuaZipFile(quazip->getZipName(), "content.xml",
                                     QuaZip::csSensitive, this);
    QDomDocument doc("content.xml");
    doc.setContent(content);
    content->close();
    delete content;
    delete quazip;
    QDomProcessingInstruction pc = doc.createProcessingInstruction(
            "xml-stylesheet", "href='data:text/css;base64,"
                                   + css.toUtf8().toBase64() + "' type='text/css'");
    if (doc.firstChild().isProcessingInstruction()) {
        doc.insertAfter(pc, doc.firstChild());
    } else {
        doc.insertBefore(pc, doc.firstChild());
    }
    QFile out(outputfile);
    out.open(QIODevice::WriteOnly);
    out.write(doc.toByteArray());
    out.close();

    emit conversionFinished();
}
