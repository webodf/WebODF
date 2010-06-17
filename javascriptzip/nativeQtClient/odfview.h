#ifndef ODFVIEW_H
#define ODFVIEW_H

#include <QWebView>

class OdfView : public QWebView
{
Q_OBJECT
public:
    OdfView();
    bool loadFile(const QString &fileName);
    QString currentFile() { return curFile; }

private:
    QString curFile;
};

#endif // ODFVIEW_H
