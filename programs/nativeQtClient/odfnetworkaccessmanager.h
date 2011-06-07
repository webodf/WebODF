#ifndef ODFNETWORKACCESSMANAGER_H
#define ODFNETWORKACCESSMANAGER_H

#include <QtNetwork/QNetworkAccessManager>
#include <QtCore/QDebug>
#include <QtCore/QDir>
#include "zipnetworkreply.h"

class QDir;

class OdfNetworkAccessManager : public QNetworkAccessManager {
private:
    QDir dir;
    QDir odfdir;
    QStringList allowedFiles;
    OdfContainer *currentFile;
public:
    OdfNetworkAccessManager(const QDir& localdir) :dir(localdir) {
        allowedFiles << "embedodf.html"
                << "webodf.css"
                << "webodf.js"
                << "lib/runtime.js";
    }
    QNetworkReply* createRequest(Operation op, const QNetworkRequest& req,
                                 QIODevice* data = 0) {
        if (req.url().scheme() == "odfkit") {
            //data is inside the current zip file
            return new ZipNetworkReply(this, currentFile, req, op);
        }
        QNetworkRequest r(req);
        QString path;
        if (dir.absolutePath().startsWith(":")) {
            path = req.url().toString().mid(3);
        } else {
            path = req.url().toLocalFile();
        }
        QString relpath = dir.relativeFilePath(path);
        if (op != GetOperation
                || !allowedFiles.contains(relpath)) {
            // changing the url seems to be the only easy way to deny
            // requests
            r.setUrl(QUrl("error:not-allowed"));
        }
        return QNetworkAccessManager::createRequest(op, r, data);
    }
    void setCurrentFile(OdfContainer *file) {currentFile = file;}
};

#endif // ODFNETWORKACCESSMANAGER_H
