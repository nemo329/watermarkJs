const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const { unlinkSync, writeFileSync, readFileSync } = require("fs");
const { degrees, PDFDocument, StandardFonts, grayscale } = require('pdf-lib');
const { Poppler } = require("node-poppler");
var PDFDocumentKit = require('pdfkit');
const fs = require('fs');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('app/index.html')



  // Main process
  ipcMain.handle('modify', async (event, argsTo) => {
    console.log(argsTo.filePath)
    const pdfDoc = await PDFDocument.load(readFileSync(argsTo.filePath));
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const tempUrl = argsTo.filePath.substring(0, argsTo.filePath.length - 4) + "_temp_protected.pdf"
    const finalUrl = argsTo.filePath.substring(0, argsTo.filePath.length - 4) + "_watermarked.pdf"

    const pages = pdfDoc.getPages()
    for (let i = 0; i < pages.length; i++) {
      const firstPage = pages[i]
      const { width, height } = firstPage.getSize()

      for (let j = 0; j < 16; j++) {
        for (let k = 0; k < 20; k++) {
          const textSize = 12
          const textWidth = helveticaFont.widthOfTextAtSize(argsTo.message, textSize)
          const textHeight = helveticaFont.heightAtSize(textSize)

          firstPage.drawText(argsTo.message, {
            size: textSize,
            x: width / (10 + 5) * 2 * j,
            y: height / (6) * k,
            font: helveticaFont,
            color: grayscale(0.3),
            rotate: degrees(-45),
          })
          firstPage.drawRectangle({
            x: width / (10 + 5) * 2 * j,
            y: height / (6) * k,
            width: textWidth + 3,
            height: textHeight,
            rotate: degrees(-45),
            color: grayscale(0.8),
            opacity: 0.2
          })
        }


      }
    }

    const pdfBytes = await pdfDoc.save()
    writeFileSync(tempUrl, pdfBytes);

    const file = tempUrl;
    const poppler = new Poppler();
    const options = {
      firstPageToConvert: 1,
      lastPageToConvert: pages.length,
      pngFile: true,
    };
    const outputFile =argsTo.filePath.substring(0, argsTo.filePath.length - 4) + 'temp_protected';

    const res = await poppler.pdfToCairo(file, outputFile, options);
    console.log(res);

    unlinkSync(tempUrl);

    let doc = new PDFDocumentKit({ size: 'A4', autoFirstPage: false });

    doc.pipe(fs.createWriteStream(finalUrl));


    for (let i = 1; i < pages.length + 1; i++) {
      const image = argsTo.filePath.substring(0, argsTo.filePath.length - 4) +'temp_protected-' + i + '.png';
      doc.addPage()

      doc.image(image, 20, 20, { width: 555.28, align: 'center', valign: 'center' })

      unlinkSync(image);


    }


    doc.end();
    var argsTo = {
      success: true, 
      path: finalUrl
    };
    win.webContents.send("D", argsTo);
    return pdfBytes
  })

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

