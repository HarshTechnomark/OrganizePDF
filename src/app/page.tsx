"use client";
import { useState, ChangeEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [newOrder, setNewOrder] = useState<number[]>([]);
  const [modifiedFilePath, setModifiedFilePath] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    // Fetch number of pages from backend
    const formData = new FormData();
    formData.append("file", uploadedFile);

    fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => setNumPages(data.numPages))
      .catch((error) =>
        console.error("Error fetching number of pages:", error)
      );
  };

  const handleOrderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    const sanitizedValue = value.replace(/[^\d,]/g, "");

    const order = sanitizedValue
      .split(",")
      .map((index) => parseInt(index.trim(), 10))
      .filter((index) => !isNaN(index) && index > 0 && index <= numPages);

    setNewOrder(order);
  };

  const handleReorder = async () => {
    if (!file || newOrder.length !== numPages) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("order", JSON.stringify(newOrder));

    try {
      const response = await fetch("http://localhost:8000/reorder", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setModifiedFilePath(data.filePath);
    } catch (error) {
      console.error("Error reordering pages:", error);
    }
  };

  const handleViewInAdobe = () => {
    // Open Adobe Viewer in new tab
    window.open(
      `https://docs.google.com/viewer?url=${modifiedFilePath}&embedded=true`,
      "_blank"
    );
  };

  return (
    <div className="p-4 flex flex-col items-start justify-center gap-5 w-screen">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1>PDF Page Organizer</h1>
          <input type="file" onChange={handleFileChange} />
        </div>

        {modifiedFilePath && (
          <div className="gap-2 flex items-center justify-center">
            <a
              href={modifiedFilePath}
              target="_blank"
              rel="noopener noreferrer"
              download="modified.pdf"
              className="border border-blue-300 p-2 rounded-md cursor-pointer text-blue-500"
            >
              Download PDF
            </a>
            <button
              className="border border-red-400 p-2 rounded-md cursor-pointer text-red-500"
              onClick={handleViewInAdobe}
            >
              View in Adobe Viewer
            </button>
          </div>
        )}
      </div>
      {numPages > 0 && (
        <div className="flex flex-col items-start justify-start gap-2">
          <p>Number of Pages: {numPages}</p>
          <p>
            Enter new page order (comma-separated indices, e.g., 2,8,1 between 1
            to {numPages}):
          </p>
          <div className="flex items-start justify-start gap-2">
            <input
              type="text"
              onChange={handleOrderChange}
              className="outline-none border border-gray-500 p-2 rounded-lg"
              placeholder="Enter page order"
            />
            <button
              className="border border-blue-400 p-2 rounded-md cursor-pointer text-blue-500"
              onClick={handleReorder}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
