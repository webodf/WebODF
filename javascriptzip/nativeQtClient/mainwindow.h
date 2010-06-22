#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QtGui/QMainWindow>
#include <QtGui/QMdiSubWindow>

namespace Ui {
    class MainWindow;
}

class OdfView;
class QFileSystemModel;
class QTreeView;
class QDockWidget;
class QModelIndex;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    MainWindow(QWidget *parent = 0);
    ~MainWindow();

private slots:
    void open();
    OdfView *createOdfView();
    void loadOdf(const QModelIndex& index);

private:
    QMdiSubWindow *findMdiChild(const QString &fileName);
    void createActions();
    void createToolBars();
    QToolBar *fileToolBar;
    QAction *openAct;
protected:
    void changeEvent(QEvent *e);

private:
    Ui::MainWindow *ui;
    QFileSystemModel* dirmodel;
    QTreeView* dirview;
    QDockWidget* dirdock;
};

#endif // MAINWINDOW_H
