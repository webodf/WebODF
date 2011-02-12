#ifndef ODFVIEW_H
#define ODFVIEW_H

#include <QtWebKit/QWebView>

class Odf;
class OdfNetworkAccessManager;

class OdfView : public QWebView
{
Q_OBJECT
public:
    OdfView(QWidget* parent);
    ~OdfView();
    QString currentFile() { return curFile; }

public slots:
    bool loadFile(const QString &fileName);

private slots:
    void slotLoadFinished(bool ok);
    void slotInitWindowObjects();

private:
    bool loaded;
    QString curFile;
    QString identifier;
    OdfNetworkAccessManager* networkaccessmanager;
    Odf* odf;
};

#endif // ODFVIEW_H
