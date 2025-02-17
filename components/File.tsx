// 'use client';

// import React, { useState, useRef, useEffect } from "react";
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import * as pdfjsLib from 'pdfjs-dist';
// import { saveAs } from 'file-saver';

// const File = () => {
//   const [pdfFile, setPdfFile] = useState<File | null>(null);
//   const [annotationsByPage, setAnnotationsByPage] = useState<{ [page: number]: Array<{ x: number, y: number, type: string }> }>({});
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [annotationType, setAnnotationType] = useState<string>('tick');
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [scale, setScale] = useState<number>(1);  // Default scale for rendering the PDF
//   const [pdfDimensions, setPdfDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
//   const [totalPages, setTotalPages] = useState<number>(0);  // Keep track of total pages


//   useEffect(() => {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
//   }, []);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
//     setTotalPages(0);  // Reset total pages to 0
//     setAnnotationsByPage({});  // Reset annotations

  
//     const file = e.target.files?.[0];
//     if (file) {
//       setPdfFile(file);  // Set the new PDF file
      
//     }
//   };
  

//   useEffect(() => {
//     if (pdfFile && canvasRef.current) {
//       renderPdf(currentPage);

//     }
//   }, [pdfFile, currentPage]);



//   const renderPdf = async (pageNum: number) => {
//     if (pdfFile && canvasRef.current) {
//       const fileReader = new FileReader();
//       fileReader.onload = async (event) => {
//         const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
//         const loadingTask = pdfjsLib.getDocument(pdfData);
//         const pdf = await loadingTask.promise;

//         setTotalPages(pdf.numPages);  // Set the total number of pages in the PDF

//         const page = await pdf.getPage(pageNum);  // Render the specified page
//         const viewport = page.getViewport({ scale });

//         setPdfDimensions({ width: viewport.width, height: viewport.height });

//         const canvas = canvasRef.current;
//         if (canvas) {
//           const context = canvas.getContext('2d');
//           if (context) {
//             canvas.height = viewport.height;
//             canvas.width = viewport.width;
//             page.render({ canvasContext: context, viewport }).promise.then(() => {
//               renderAnnotations(pageNum);  // Re-render annotations for the current page
//             });
//           }
//         }
//       };
//       fileReader.readAsArrayBuffer(pdfFile);
//     }
//   };

//   const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const rect = canvas.getBoundingClientRect();
//       const x = (e.clientX - rect.left) / scale;
//       const y = (e.clientY - rect.top) / scale;

//       // Log the click position, page, and annotation type
//       console.log(`Clicked on page ${currentPage} at coordinates (${x}, ${y}) with annotation type: ${annotationType}`);

//       // Track annotation with x, y, type, and page number
//       const newAnnotations = { ...annotationsByPage };
//       if (!newAnnotations[currentPage]) newAnnotations[currentPage] = [];
//       newAnnotations[currentPage].push({ x, y, type: annotationType });
//       setAnnotationsByPage(newAnnotations);
//       renderAnnotation(x, y, annotationType);  // Immediately render the annotation on canvas
//     }
//   };

//   const renderAnnotation = (x: number, y: number, type: string) => {
//     const canvas = canvasRef.current;
//     const context = canvas?.getContext('2d');
//     if (context) {
//       context.font = "15px Arial";
//       context.fillStyle = type === 'tick' ? 'green' : 'red';
//       context.fillText(type === 'tick' ? '✔' : '✘', x * scale, y * scale);

//       // Log the annotation rendering
//       console.log(`Rendering annotation: ${type === 'tick' ? '✔' : '✘'} at (${x * scale}, ${y * scale}) on page ${currentPage}`);
//     }
//   };

//   const renderAnnotations = (page: number) => {
//     const canvas = canvasRef.current;
//     const context = canvas?.getContext('2d');
//     if (context && annotationsByPage[page]) {
//       annotationsByPage[page].forEach(({ x, y, type }) => {
//         context.font = "20px Arial";
//         context.fillStyle = type === 'tick' ? 'green' : 'red';
//         context.fillText(type === 'tick' ? '✔' : '✘', x * scale, y * scale);

//         // Log the annotation rendering
//         console.log(`Rendering annotation: ${type === 'tick' ? '✔' : '✘'} at (${x * scale}, ${y * scale}) on page ${page}`);
//       });
//     }
//   };
//   const savePdfWithAnnotations = async () => {
//     if (pdfFile) {
//       const fileReader = new FileReader();
//       fileReader.onload = async (event) => {
//         const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
//         const pdfDoc = await PDFDocument.load(pdfData);

//         // Embed ZapfDingbats font using StandardFonts
//         const zapfDingbats = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);

//         // Loop through annotations and embed them in the PDF
//         Object.keys(annotationsByPage).forEach((pageNum) => {
//           // Since pdf-lib uses 0-based index for pages, we need to subtract 1
//           const page = pdfDoc.getPage(Number(pageNum) - 1);  // Subtract 1 to adjust page index

//           // Get the page height
//           const pageHeight = page.getHeight();

//           annotationsByPage[Number(pageNum)].forEach(({ x, y, type }) => {
//             // Log annotation being saved to PDF
//             console.log(`Saving annotation: ${type === 'tick' ? '✔' : '✘'} at (${x}, ${y}) on page ${pageNum}`);

//             // Use Unicode for tick and cross
//             const unicodeTick = '\u2714';  // Unicode for tick ✔
//             const unicodeCross = '\u2716'; // Unicode for cross ✘

//             const text = type === 'tick' ? unicodeTick : unicodeCross;

//             // Invert the Y-coordinate (since PDF's Y starts from bottom-left)
//             const invertedY = pageHeight - y; // Flip Y-coordinate to match PDF's coordinate system

//             // Don't apply scale when saving the annotation to the PDF
//             page.drawText(text, {
//               x: x, // Use the original x position (no scaling)
//               y: invertedY, // Inverted y position to match PDF's coordinate system
//               size: 12,
//               font: zapfDingbats,  // Using ZapfDingbats font
//               color: rgb(0, 0, 0),
//             });
//           });
//         });

//         const modifiedPdfBytes = await pdfDoc.save();
//         const modifiedBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
//         saveAs(modifiedBlob, 'modified.pdf');
//       };
//       fileReader.readAsArrayBuffer(pdfFile);
//     }
//   };


//   // Ensure the page number is valid (between 1 and totalPages)
//   const handlePageChange = (direction: "prev" | "next") => {
//     setCurrentPage((prevPage) => {
//       if (direction === "prev" && prevPage > 1) {
//         return prevPage - 1;
//       }
//       if (direction === "next" && prevPage < totalPages) {
//         return prevPage + 1;
//       }
//       return prevPage;
//     });
//   };


//   const clearAllAnnotations = () => {

//     setAnnotationsByPage({});  // Reset all annotations from state
//     // Clear the canvas visually
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const context = canvas.getContext('2d');
//       if (context) {
//         // Clear the entire canvas
//         context.clearRect(0, 0, canvas.width, canvas.height);
//       }
//     }


//     // Re-render the PDF after clearing annotations
//     renderPdf(currentPage);

//   };




//   const removeLastMark = () => {
//     const newAnnotations = { ...annotationsByPage };
//     if (newAnnotations[currentPage] && newAnnotations[currentPage].length > 0) {
//       newAnnotations[currentPage].pop();  // Remove the last annotation for the current page
//       setAnnotationsByPage(newAnnotations);
//       renderPdf(currentPage);  // Re-render the PDF after removing the last mark
//     }
//   };


//   return (
//     <div className="container mx-auto p-4 max-w-4xl">
//       <div className="flex mb-6">
//         {/* <h1 className="text-2xl font-bold flex-initial">PDF Editing Web App</h1> */}
//         <div className="flex justify-center flex-grow">
//           <input
//             type="file"
//             accept="application/pdf"
//             onChange={handleFileChange}
//             className="p-3 border border-gray-300 rounded-md shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>




//       {/* Annotation and Clear/Remove Buttons */}
//       {pdfFile && (
//         <div className="flex flex-col items-center mb-6">
//           <div className="flex items-center space-x-4 mb-4">
//             <select
//               value={annotationType}
//               onChange={(e) => setAnnotationType(e.target.value)}
//               className="p-2 border border-gray-300 rounded-md shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="tick">✔</option>
//               <option value="cross">✘</option>
//             </select>

//             <button
//               onClick={clearAllAnnotations}
//               className="px-6 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors"
//             >
//               Clear All
//             </button>
//             <button
//               onClick={removeLastMark}
//               className="px-6 py-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600 transition-colors"
//             >
//               Remove Last Mark
//             </button>
//             <button
//               onClick={savePdfWithAnnotations}
//               className=" px-6 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors"
//             >
//               Download
//             </button>
//           </div>

//           {/* Page Navigation */}
//           <div className="mt-4 flex items-center justify-center space-x-4">

//             {/* First Page Button */}
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1}
//               className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage === 1
//                 ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
//                 : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
//                 } transition-colors duration-200`}
//             >
//               First
//             </button>

//             {/* Previous Button (Personalized) */}
//             {currentPage > 1 && (
//               <button
//                 onClick={() => handlePageChange("prev")}
//                 className="px-6 py-2 rounded-full border-2 text-sm font-medium bg-white text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
//               >
//                 Go Back
//               </button>
//             )}

//             {/* Current Page Display */}
//             <span className="px-6 py-2 text-lg font-semibold text-gray-700">
//               Page {currentPage}
//             </span>

//             {/* Next Button */}
//             <button
//               onClick={() => handlePageChange("next")}
//               disabled={currentPage >= totalPages}
//               className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage >= totalPages
//                 ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
//                 : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
//                 } transition-colors duration-200`}
//             >
//               Next
//             </button>

//             {/* Last Page Button */}
//             <button
//               onClick={() => setCurrentPage(totalPages)}
//               disabled={currentPage === totalPages}
//               className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage === totalPages
//                 ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
//                 : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
//                 } transition-colors duration-200`}
//             >
//               Last
//             </button>
//           </div>




//           {/* Save Button */}


//           {/* Canvas Container */}
//           <div className="relative w-full h-full mt-6 flex justify-center items-center">
//             <canvas
//               ref={canvasRef}
//               className="border" // Limit the max width to make it look good on larger screens
//               onClick={handleCanvasClick}
//             />
//           </div>


//         </div>
//       )}
//     </div>
//   );
// };

// export default File;


'use client';

import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';

const File = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [annotationsByPage, setAnnotationsByPage] = useState<{ [page: number]: Array<{ x: number, y: number, type: string }> }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [annotationType, setAnnotationType] = useState<string>('tick');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);  // Default scale for rendering the PDF
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [totalPages, setTotalPages] = useState<number>(0);  // Keep track of total pages
  const renderInProgress = useRef(false);  // Track if render is in progress

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset annotations and page number when a new file is selected
    setAnnotationsByPage({});  // Clear annotations
    setCurrentPage(1);  // Reset to the first page

    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);  // Set the new PDF file
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Ctrl+Z to trigger removeLastMark
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault(); // Prevent default browser undo behavior
        removeLastMark(); // Trigger the function to remove the last mark
      }
    };

    // Attach event listener on component mount
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [annotationsByPage, currentPage]);
  
  useEffect(() => {
    if (pdfFile && canvasRef.current) {
        // Clear the canvas when a new PDF is loaded
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height); // Clear any existing drawings
        }
        renderPdf(currentPage);  // Render the first page of the newly selected PDF
    }
}, [pdfFile, currentPage]);  // Re-render when pdfFile or currentPage changes

  const renderPdf = async (pageNum: number) => {
    if (renderInProgress.current) return;  // Prevent rendering if another render is in progress
    renderInProgress.current = true;

    if (pdfFile && canvasRef.current) {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument(pdfData);
        const pdf = await loadingTask.promise;

        setTotalPages(pdf.numPages);  // Set the total number of pages in the PDF

        const page = await pdf.getPage(pageNum);  // Render the specified page
        const viewport = page.getViewport({ scale });

        setPdfDimensions({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({ canvasContext: context, viewport }).promise.then(() => {
              renderInProgress.current = false;  // Mark rendering as complete
              renderAnnotations(pageNum);  // Re-render annotations for the current page
            });
          }
        }
      };
      fileReader.readAsArrayBuffer(pdfFile);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // Log the click position, page, and annotation type
      console.log(`Clicked on page ${currentPage} at coordinates (${x}, ${y}) with annotation type: ${annotationType}`);

      // Track annotation with x, y, type, and page number
      const newAnnotations = { ...annotationsByPage };
      if (!newAnnotations[currentPage]) newAnnotations[currentPage] = [];
      newAnnotations[currentPage].push({ x, y, type: annotationType });
      setAnnotationsByPage(newAnnotations);
      renderAnnotation(x, y, annotationType);  // Immediately render the annotation on canvas
    }
  };

  const renderAnnotation = (x: number, y: number, type: string) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.font = "12px Arial";
      context.fillStyle = type === 'tick' ? 'green' : 'red';
      context.fillText(type === 'tick' ? '✔' : '✘', x * scale, y * scale);

      // Log the annotation rendering
      console.log(`Rendering annotation: ${type === 'tick' ? '✔' : '✘'} at (${x * scale}, ${y * scale}) on page ${currentPage}`);
    }
  };

  const renderAnnotations = (page: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && annotationsByPage[page]) {
      annotationsByPage[page].forEach(({ x, y, type }) => {
        context.font = "12px Arial";
        context.fillStyle = type === 'tick' ? 'green' : 'red';
        context.fillText(type === 'tick' ? '✔' : '✘', x * scale, y * scale);

        // Log the annotation rendering
        console.log(`Rendering annotation: ${type === 'tick' ? '✔' : '✘'} at (${x * scale}, ${y * scale}) on page ${page}`);
      });
    }
  };

  const savePdfWithAnnotations = async () => {
    if (pdfFile) {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdfDoc = await PDFDocument.load(pdfData);

        // Embed ZapfDingbats font using StandardFonts
        const zapfDingbats = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);

        // Loop through annotations and embed them in the PDF
        Object.keys(annotationsByPage).forEach((pageNum) => {
          const page = pdfDoc.getPage(Number(pageNum) - 1);  // Subtract 1 to adjust page index
          const pageHeight = page.getHeight();

          annotationsByPage[Number(pageNum)].forEach(({ x, y, type }) => {
            const unicodeTick = '\u2714';  // Unicode for tick ✔
            const unicodeCross = '\u2716'; // Unicode for cross ✘
            const text = type === 'tick' ? unicodeTick : unicodeCross;
            const invertedY = pageHeight - y; // Flip Y-coordinate to match PDF's coordinate system

            page.drawText(text, {
              x: x, 
              y: invertedY, 
              size: 12,
              font: zapfDingbats, 
              color: rgb(0, 0, 0),
            });
          });
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        saveAs(modifiedBlob, 'modified.pdf');
      };
      fileReader.readAsArrayBuffer(pdfFile);
    }
  };

  // Ensure the page number is valid (between 1 and totalPages)
  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage((prevPage) => {
      if (direction === "prev" && prevPage > 1) {
        return prevPage - 1;
      }
      if (direction === "next" && prevPage < totalPages) {
        return prevPage + 1;
      }
      return prevPage;
    });
  };

  const clearAllAnnotations = () => {
    setAnnotationsByPage({});  // Reset all annotations from state
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);  // Clear the entire canvas
      }
    }
    renderPdf(currentPage);  // Re-render the PDF after clearing annotations
  };

  const removeLastMark = () => {
    const newAnnotations = { ...annotationsByPage };
    if (newAnnotations[currentPage] && newAnnotations[currentPage].length > 0) {
      newAnnotations[currentPage].pop();  // Remove the last annotation for the current page
      setAnnotationsByPage(newAnnotations);
      renderPdf(currentPage);  // Re-render the PDF after removing the last mark
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex mb-6">
        <div className="flex justify-center flex-grow">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="p-3 border border-gray-300 rounded-md shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Annotation and Clear/Remove Buttons */}
      {pdfFile && (
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tick">✔</option>
              <option value="cross">✘</option>
            </select>

            <button
              onClick={clearAllAnnotations}
              className="px-6 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={removeLastMark}
              className="px-6 py-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600 transition-colors"
            >
              Undo
            </button>
            <button
              onClick={savePdfWithAnnotations}
              className=" px-6 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors"
            >
              Download
            </button>
          </div>

          {/* Page Navigation */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage === 1
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                } transition-colors duration-200`}
            >
              First
            </button>

            {currentPage > 1 && (
              <button
                onClick={() => handlePageChange("prev")}
                className="px-6 py-2 rounded-full border-2 text-sm font-medium bg-white text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
              >
                Go Back
              </button>
            )}

            <span className="px-6 py-2 text-lg font-semibold text-gray-700">
              Page {currentPage}
            </span>

            <button
              onClick={() => handlePageChange("next")}
              disabled={currentPage >= totalPages}
              className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage >= totalPages
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                } transition-colors duration-200`}
            >
              Next
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-6 py-2 rounded-full border-2 text-sm font-medium ${currentPage === totalPages
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                } transition-colors duration-200`}
            >
              Last
            </button>
          </div>

          {/* Canvas Container */}
          <div className="relative w-50 mt-6 flex justify-center items-center">
            <canvas
              ref={canvasRef}
              className="border" 
              onClick={handleCanvasClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default File;
