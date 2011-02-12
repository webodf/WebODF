#ifndef ODFTOHTMLCONVERTER_H
#define ODFTOHTMLCONVERTER_H

#include <QObject>

class QWebPage;
class Odf;
class QTimer;

class OdfToHtmlConverter : public QObject
{
Q_OBJECT
public:
    OdfToHtmlConverter(QObject* parent = 0);

    void convertToHtml(const QString& inputfile, const QString& outputfile);
signals:
    void conversionFinished();
private slots:
    void loadOdf();
    void slotInitWindowObjects();
    void periodicCheck();
private:
    QWebPage* page;
    Odf* odf;
    QTimer* timer;
    QString inputfile;
    QString outputfile;

    void serialize();
};

#endif // ODFTOHTMLCONVERTER_H
