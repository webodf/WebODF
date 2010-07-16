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
        allowedFiles << "odf.html" << "style2css.js" << "defaultodfstyle.css"
                << "qtodf.js";
    }
    QNetworkReply* createRequest(Operation op, const QNetworkRequest& req,
                                 QIODevice* data = 0) {
        qDebug() << req.url();
        if (req.url().scheme() == "odfkit") {
            //data is inside the current zip file
            qDebug() << "zip! " << req.url();
            return new ZipNetworkReply(this, currentFile, req, op);
        }

        QNetworkRequest r(req);
        QString path;
        if (dir.absolutePath().startsWith(":")) {
            path = req.url().toString().mid(3);
        } else {
            path = req.url().toLocalFile();
        }
        QFileInfo fileinfo = path;
        if (op != GetOperation
                || !allowedFiles.contains(fileinfo.fileName())
                || fileinfo.dir() != dir) {
            // changing the url seems to be the only easy way to deny
            // requests
            qDebug() << "deny " << req.url();
            r.setUrl(QUrl("error:not-allowed"));
        }
        return QNetworkAccessManager::createRequest(op, r, data);
    }
    void setCurrentFile(OdfContainer *file) {currentFile = file;}
};

#endif // ODFNETWORKACCESSMANAGER_H
