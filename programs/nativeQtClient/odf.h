#ifndef ODF_H
#define ODF_H

#include <QtCore/QObject>
#include <QtCore/QVariant>
#include <QtCore/QUrl>

class OdfContainer;
class QWebFrame;

class Odf : public QObject
{
Q_OBJECT
public:
    Odf(QWebFrame* f, QUrl p, QObject* parent) :QObject(parent), frame(f), prefix(p) {}
    OdfContainer* getContainer(const QString& url);
    OdfContainer* getOpenContainer(const QString& id);

    void addFile(const QString& containerid, const QString& path);

    Q_PROPERTY(QString callbackdata READ getCallbackData);
public slots:
    QString read(QString containerid, int offset, int length);
    QString readFileSync(QString path);
    int getFileSize(QString containerid);
private:
    QMap<QString, OdfContainer*> openfiles;
    QWebFrame* const frame;
    QUrl prefix;
    QString callbackdata;
    QMap<QString, QByteArray> filedata;

    QString getCallbackData() const { return callbackdata; }
};

#endif // ODF_H
