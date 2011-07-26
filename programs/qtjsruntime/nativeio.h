#ifndef NATIVEIO_H
#define NATIVEIO_H

#include <QtCore/QFile>
#include <QtCore/QMap>

class QWebPage;

// class that exposes filesystem to web environment
class NativeIO : public QObject {
Q_OBJECT
private:
    QWebPage* webpage;
    QString errstr;
    const QMap<QString, QFile::Permissions> pathPermissions;
public:
    NativeIO(QObject* parent,
             const QMap<QString, QFile::Permissions>& pathPermissions
             = QMap<QString, QFile::Permissions>());
public slots:
    /**
     * Return the last error.
     */
    QString error() {
        return errstr;
    }
    QString readFileSync(const QString& path, const QString& encoding);
    QString read(const QString& path, int offset, int length);
    void writeFile(const QString& path, const QString& data);
    void unlink(const QString& path);
    int getFileSize(const QString& path);
    void exit(int exitcode);
};

#endif
