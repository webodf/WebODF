#ifndef ODFVIEW_H
#define ODFVIEW_H

#include <QtWebKit/QWebView>

class OdfContainer;

class OdfView : public QWebView
{
Q_OBJECT
public:
    OdfView();
    ~OdfView();
    bool loadFile(const QString &fileName);
    QString currentFile() { return curFile; }

private slots:
    void slotLoadFinished(bool ok);

private:
    bool loaded;
    QString curFile;
    class OdfNetworkAccessManager;
    OdfNetworkAccessManager* networkaccessmanager;
    OdfContainer* odfcontainer;
};

#endif // ODFVIEW_H
