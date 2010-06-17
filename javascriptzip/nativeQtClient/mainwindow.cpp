#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "odfview.h"
#include <QtGui/QFileDialog>
#include <QtGui/QMdiArea>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    createActions();
    createToolBars();

    setWindowTitle(tr("MDI"));
    setUnifiedTitleAndToolBarOnMac(true);
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::changeEvent(QEvent *e)
{
    QMainWindow::changeEvent(e);
    switch (e->type()) {
    case QEvent::LanguageChange:
        ui->retranslateUi(this);
        break;
    default:
        break;
    }
}
void MainWindow::open()
{
    QString fileName = QFileDialog::getOpenFileName(this, QString(), QString(), tr("Office Files (*.odt *.odp *.ods)"));
    if (!fileName.isEmpty()) {
        QMdiSubWindow *existing = findMdiChild(fileName);
        if (existing) {
            ui->mdiArea->setActiveSubWindow(existing);
            return;
        }

        OdfView *child = createOdfView();
        if (child->loadFile(fileName)) {
            statusBar()->showMessage(tr("File loaded"), 2000);
            child->show();
        } else {
            child->close();
        }
    }
}
void MainWindow::createActions()
{
    openAct = new QAction(QIcon(":/images/open.png"), tr("&Open..."), this);
    openAct->setShortcuts(QKeySequence::Open);
    openAct->setStatusTip(tr("Open an existing file"));
    connect(openAct, SIGNAL(triggered()), this, SLOT(open()));
}
void MainWindow::createToolBars()
{
    fileToolBar = addToolBar(tr("File"));
    fileToolBar->addAction(openAct);
}
QMdiSubWindow *MainWindow::findMdiChild(const QString &fileName)
{
    QString canonicalFilePath = QFileInfo(fileName).canonicalFilePath();

    foreach (QMdiSubWindow *window, ui->mdiArea->subWindowList()) {
        OdfView *odfView = qobject_cast<OdfView *>(window->widget());
        if (odfView->currentFile() == canonicalFilePath)
            return window;
    }
    return 0;
}

OdfView *MainWindow::createOdfView()
{
    OdfView *view = new OdfView();
    ui->mdiArea->addSubWindow(view);

    return view;
}
