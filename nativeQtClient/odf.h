#ifndef ODF_H
#define ODF_H

#include <QtCore/QObject>
#include <QtCore/QVariant>

class OdfContainer;
class QWebFrame;

class Odf : public QObject
{
Q_OBJECT
public:
    Odf(QWebFrame* f, QObject* parent) :QObject(parent), frame(f) {}
    OdfContainer* getContainer(const QString& url);
    OdfContainer* getOpenContainer(const QString& id);

    void addFile(const QString& containerid, const QString& path);

    Q_PROPERTY(QString callbackdata READ getCallbackData);
public slots:
    QString load(QString containerid, QString path, QString callbackid);
private:
    QMap<QString, OdfContainer*> openfiles;
    QWebFrame* const frame;
    QString callbackdata;

    QString getCallbackData() const { return callbackdata; }
};

#endif // ODF_H
