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

    void addFile(const QString& containerid, const QString& path);
public slots:
    QString load(QString containerid, QString path, QString odfcontainerid);
private:
    QMap<QString, OdfContainer*> openfiles;
    QWebFrame* const frame;
};

#endif // ODF_H
