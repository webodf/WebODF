#ifndef ODFCONTAINER_H
#define ODFCONTAINER_H

#include <QtCore/QObject>
#include <QtCore/QUrl>

class QuaZip;

class OdfContainer : public QObject
{
Q_OBJECT
public:
    OdfContainer(const QUrl& url, QObject* parent);
    ~OdfContainer();

    QUrl url() const { return url_; }
    QString loadAsString(const QString& path);
    QIODevice* getFile(const QString &path, QObject *parent);

private:
    const QUrl url_;
    QuaZip* quazip;
};

#endif // ODFCONTAINER_H
