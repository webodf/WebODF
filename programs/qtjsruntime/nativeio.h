#ifndef NATIVEIO_H
#define NATIVEIO_H

// class that exposes filesystem to web environment

#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtGui/QApplication>
#include <QtCore/QObject>
#include <QtCore/QTextCodec>
#include <QtCore/QFile>
#include <QtCore/QFileInfo>
#include <QtCore/QDebug>

class NativeIO : public QObject {
Q_OBJECT
private:
    QWebPage* webpage;
public:
    NativeIO(QWebPage* parent) :QObject(parent), webpage(parent) {
    }
public slots:
    void writeFile(const QString& path, const QString& data,
            const QString& callbackName) {
        QByteArray d = data.toLatin1();
        QFile f(path);
        QString result = "null";
        if (!f.open(QIODevice::WriteOnly)) {
            result = "'Could not open file for writing.'";
        } else {
            if (f.write(d) != d.length()) {
                result = "'Error writing.'";
            }
        }
        f.close();
        webpage->mainFrame()->evaluateJavaScript(callbackName +
                "(" + result + ");");
    }
    void getFileSize(const QString& path, const QString& callbackName) {
        QFileInfo file(path);
        qint64 result = -1;
        if (file.isFile()) {
            result = file.size();
        }
        webpage->mainFrame()->evaluateJavaScript(callbackName +
                "(" + QString::number(result) + ");");
    }
    void deleteFile(const QString& path, const QString& callbackName) {
        QFile file(path);
        if (file.remove()) {
            webpage->mainFrame()->evaluateJavaScript(callbackName + "(null)");
        } else {
            webpage->mainFrame()->evaluateJavaScript(callbackName +
                    "('Error deleting file.')");
        }
    }
    void exit(int exitcode) {
        qApp->exit(exitcode);
    }
};

#endif
