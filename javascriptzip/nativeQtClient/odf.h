#ifndef ODF_H
#define ODF_H

#include <QtCore/QObject>
#include <QtCore/QVariant>

class OdfContainer;

class Odf : public QObject
{
Q_OBJECT
public:
    Odf(QObject* parent) :QObject(parent) {}
    OdfContainer* getContainer(const QString& url);

    void addFile(const QString& containerid, const QString& path);
public slots:
    QString load(QString containerid, QString path, QVariant callback);
private:
    QMap<QString, OdfContainer*> openfiles;
};

#endif // ODF_H
