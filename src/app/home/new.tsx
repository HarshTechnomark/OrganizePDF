"use client";
import { useState, useEffect } from "react";
import { LinearProgress, Tooltip, IconButton, Button } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Close } from "@mui/icons-material";
import Dropzone from "react-dropzone";

export default function Home() {
  const [numPages, setNumPages] = useState<number>(0);
  const [newOrder, setNewOrder] = useState<{ id: number; order: number }[]>([]);
  const [modifiedFilePath, setModifiedFilePath] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<0 | 1 | 2 | 3>(0);
  const [progress, setProgress] = useState(0);

  const allowedExtensions = ["pdf"];

  const validateFile = (file: File, type: number) => {
    if (type === 1) {
      const fileType = `${file.name}`;
      const fileTypeParts = fileType.split(".");
      const fileTypeExtension = fileTypeParts[fileTypeParts.length - 1];
      return allowedExtensions.includes(fileTypeExtension.toLowerCase());
    }
    if (type === 2) {
      const fileSizeInMB = Math.round(file.size / 1024 / 1024);
      return fileSizeInMB > 200;
    }
    return true;
  };

  const handleFileUpload = async (value: File) => {
    const validateExtensions = 1;
    const validateSize = 2;
    setFile(value);

    if (!validateFile(value, validateExtensions)) {
      setFileErr(1);
      setFileName(null);
      setIsUploading(false);
      setProgress(0);
    } else if (validateFile(value, validateSize)) {
      setFileName(null);
      setFileErr(2);
      setIsUploading(false);
      setProgress(0);
    } else {
      setProgress(0);
      setFileErr(0);
      setFileName(value.name);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isUploading) {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 100);
        });
      }, 20);

      return () => {
        clearInterval(timer);
      };
    }
  }, [isUploading]);

  const FileNameWithTooltip = ({ file }: any) => {
    const fileName = file?.name || "";

    return (
      <>
        {fileName.length > 30 ? (
          <Tooltip title={fileName} placement="top" arrow>
            <span>{`${fileName.slice(0, 30)}...`}</span>
          </Tooltip>
        ) : (
          <span>{fileName}</span>
        )}
      </>
    );
  };

  const handleSubmit = async () => {
    if (!file || fileErr !== 0) {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { ResponseStatus, ResponseData, Message } = response.data;
      if (ResponseStatus.toLowerCase() === "success") {
        toast.success(Message);
        setNumPages(ResponseData.numPages);
        // Initialize newOrder with default IDs and orders
        const defaultOrder = Array.from(
          Array(ResponseData.numPages).keys()
        ).map((id) => ({
          id,
          order: id,
        }));
        setNewOrder(defaultOrder);
      } else {
        toast.error(Message);
      }
    } catch (error) {
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReorder = async () => {
    if (!file || newOrder.length !== numPages) {
      toast.error("Please upload a PDF file and reorder pages first.");
      return;
    }

    const orderedPages = newOrder
      .sort((a, b) => a.order - b.order)
      .map((page) => page.id + 1);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("order", JSON.stringify(orderedPages));

    setIsUploading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/reorder",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { ResponseStatus, ResponseData, Message } = response.data;
      if (ResponseStatus.toLowerCase() === "success") {
        toast.success(Message);
        setModifiedFilePath(ResponseData.filePath);
      } else {
        toast.error(Message);
      }
    } catch (error) {
      toast.error("Failed to reorder pages. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (draggedPageIndex: number, targetPageIndex: number) => {
    if (draggedPageIndex !== targetPageIndex) {
      const updatedOrder = [...newOrder];

      const [draggedPage] = updatedOrder.splice(draggedPageIndex, 1);

      updatedOrder.splice(targetPageIndex, 0, draggedPage);

      updatedOrder.forEach((page, index) => {
        page.order = index;
      });
      setNewOrder(updatedOrder);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-screen h-screen">
      <div className="flex items-center justify-center w-full">
        {numPages <= 0 && (
          <div className="py-2 h-full w-[30%] flex flex-wrap items-center justify-center text-center cursor-pointer mt-4">
            <div
              className={`!h-16 bg-slate-300 ${
                true ? `border-red-600` : `border-gray-300`
              } rounded-lg w-full overflow-hidden flex justify-center items-center`}
            >
              <span className="cursor-pointer w-full">
                {!!fileName ? (
                  <span className="text-center justify-center items-center w-full flex flex-col text-xs font-normal text-[#333] p-2">
                    {isUploading ? (
                      <div className="w-5/6">
                        <span>Uploading..</span>
                        <LinearProgress
                          className="!w-40"
                          variant="determinate"
                          value={progress}
                        />
                      </div>
                    ) : (
                      <span className="truncate w-full px-4 flex items-center justify-between">
                        <p className="text-[16px]">
                          {file && <FileNameWithTooltip file={file} />}
                        </p>
                        <IconButton
                          onClick={() => {
                            setFile(null);
                            setFileName(null);
                          }}
                        >
                          <Close />
                        </IconButton>
                      </span>
                    )}
                  </span>
                ) : (
                  <Dropzone
                    multiple={false}
                    onDrop={(acceptedFiles) =>
                      handleFileUpload(acceptedFiles[0])
                    }
                  >
                    {({ getRootProps, getInputProps }) => (
                      <section>
                        <div {...getRootProps()}>
                          <input {...getInputProps()} />
                          <span
                            className={`cursor-pointer w-full select-none flex justify-between items-center text-center text-sm font-normal text-[#333] px-4`}
                          >
                            <div className="flex items-center gap-2">
                              <CloudUploadIcon />
                              <div className="flex flex-col items-start">
                                <p className="text-xs lg:text-sm">
                                  Drag and drop files here
                                </p>
                                <p className="text-xs opacity-50">
                                  Limit 200MB per file PDF
                                </p>
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outlined"
                                className="border-gray-500 text-gray-500 bg-white hover:border-gray-500 hover:text-gray-500 hover:bg-white text-xs px-1 lg:px-2"
                              >
                                Browse Files
                              </Button>
                            </div>
                          </span>
                        </div>
                      </section>
                    )}
                  </Dropzone>
                )}
              </span>
            </div>
            <button
              className="border border-blue-300 mt-2 py-1 px-4 rounded-md cursor-pointer text-blue-500"
              onClick={handleSubmit}
            >
              Upload
            </button>
            <div className="flex w-full select-none mt-1 text-red-600 text-xs">
              {fileErr === 1
                ? "Only PDF files are accepted. Please upload a valid PDF file."
                : fileErr === 2
                ? " File size shouldn&apos;t be more than 200MB."
                : fileErr === 3
                ? " This is a required field."
                : ""}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start justify-center w-full h-screen px-10">
        {modifiedFilePath && (
          <div className="gap-2 flex items-center justify-end h-[20%] w-full">
            <a
              href={modifiedFilePath}
              target="_blank"
              rel="noopener noreferrer"
              download="modified.pdf"
              className="border border-blue-300 p-2 rounded-md cursor-pointer text-blue-500"
            >
              View PDF
            </a>
            <button
              className="border border-red-400 p-2 rounded-md cursor-pointer text-red-500"
              onClick={() =>
                window.open(
                  `https://docs.google.com/viewer?url=${modifiedFilePath}&embedded=true`,
                  "_blank"
                )
              }
            >
              View in Adobe Viewer
            </button>
          </div>
        )}
        {numPages > 0 && (
          <div className="flex flex-col items-start gap-5 h-[80%]">
            <p className="text-lg font-semibold">
              Drag and drop to reorder pages:
            </p>
            <div className="flex items-start justify-start gap-2">
              {Array.from(Array(numPages).keys()).map((pageIndex) => (
                <div
                  key={pageIndex}
                  className="border border-gray-500 p-2 rounded-lg cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", pageIndex.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const draggedPageIndex = parseInt(
                      e.dataTransfer.getData("text/plain"),
                      10
                    );
                    const targetPageIndex = pageIndex;

                    handleDrop(draggedPageIndex, targetPageIndex);
                  }}
                >
                  Page {newOrder[pageIndex]?.id}
                </div>
              ))}
            </div>
            <button
              className="border border-blue-300 mt-2 py-1 px-4 rounded-md cursor-pointer text-blue-500"
              onClick={handleReorder}
            >
              Reorder Pages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
