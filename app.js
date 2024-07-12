const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const port = 8000;

app.use(cors());

const upload = multer({
  dest: "uploads/",
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const numPages = pdfDoc.getPageCount();
    const filePath = path.join(__dirname, "uploads", req.file.originalname);
    await fs.rename(req.file.path, filePath);

    return res.status(200).json({
      ResponseStatus: "success",
      ResponseData: { numPages, filePath },
      Message: "File uploaded successfully.",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return res.status(500).json({
      ResponseStatus: "failure",
      ResponseData: null,
      Message: "Failed to process PDF",
    });
  }
});

app.post("/reorder", upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    const order = JSON.parse(req.body.order);

    if (!file) {
      return res.status(400).json({
        ResponseStatus: "failure",
        ResponseData: null,
        Message: "No file uploaded",
      });
    }

    const pdfBuffer = await fs.readFile(file.path);

    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const numPages = pdfDoc.getPageCount();
    const pages = Array.from(Array(numPages).keys());

    if (
      !Array.isArray(order) ||
      order.length !== numPages ||
      !order.every((idx) => idx >= 1 && idx <= numPages)
    ) {
      return res.status(400).json({
        ResponseStatus: "failure",
        ResponseData: null,
        Message: "Invalid page order",
      });
    }

    const reorderedPages = order.map((index) => pages[index - 1]);

    const reorderedPdfDoc = await PDFDocument.create();
    for (const pageIndex of reorderedPages) {
      const [copiedPage] = await reorderedPdfDoc.copyPages(pdfDoc, [pageIndex]);
      reorderedPdfDoc.addPage(copiedPage);
    }

    const modifiedPdfBytes = await reorderedPdfDoc.save();
    const outputFilePath = path.join(__dirname, "uploads", "modified.pdf");
    await fs.writeFile(outputFilePath, modifiedPdfBytes);

    const fullUrl = `http://localhost:${port}/uploads/modified.pdf`;

    return res.status(200).json({
      ResponseStatus: "success",
      ResponseData: { filePath: fullUrl },
      Message: "File organized successfully",
    });
  } catch (error) {
    console.error("Error reordering pages:", error);
    return res.status(500).json({
      ResponseStatus: "failure",
      ResponseData: null,
      Message: "Failed to reorder pages",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
