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
    Q_PROPERTY(QString name READ getName SCRIPTABLE true);

public slots:
    QString getContentXml();
    QString getStylesXml();

private:
    const QUrl url;
    QuaZip* quazip;

    QString getName() const { return "hello"; }
};

#endif // ODFCONTAINER_H
