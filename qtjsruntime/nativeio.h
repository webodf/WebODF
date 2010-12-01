#ifndef NATIVEIO_H
#define NATIVEIO_H

// class that exposes filesystem to web environment

#include <QtWebKit/QWebPage>
#include <QtWebKit/QWebFrame>
#include <QtCore/QObject>
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
            const QString& encoding, const QString& callbackName) {
        QFile f(path);
        QString result = "null";
        if (!f.open(QIODevice::WriteOnly)) {
            result = "'Could not open file for writing.'";
        } else {
            char buffer[1024];
            int i = 0, todo;
            while (i < data.length()) {
                todo = qMin(data.length() - i, 1024);
                for (int j = 0; j < todo; ++j) {
                    buffer[j] = data[i+j].unicode() & 0xff;
                }
                if (f.write(buffer, todo) != todo) {
                    result = "'Error writing.'";
                    break;
                }
                i += todo;
            }
            f.close();
        }
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
};

#endif
