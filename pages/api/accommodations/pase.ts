import type { NextApiResponse, NextApiRequest } from "next";
import PDFParser from "pdf2json";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser to handle raw data
  },
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const chunks: Buffer[] = [];

  // Collect data chunks from the request
  request.on("data", (chunk) => {
    chunks.push(chunk);
  });

  // When all data has been received
  request.on("end", () => {
    try {
      const pdfBuffer = Buffer.concat(chunks); // Combine all chunks into a single buffer

      const pdfParser = new PDFParser();
      const pagesDataArr: any[] = [];
      console.log("server");

      // Start parsing the PDF buffer
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          const pages = pdfData.Pages;

          // Loop through all pages
          pages.forEach((page: any, pageNum: number) => {
            const pageHLines = page.HLines;
            const pageVLines = page.VLines;
            const pageTexts = page.Texts;

            // Get right-most vertical line
            const pageLastVLine = pageVLines.at(-1);

            // Filter for the "Enter dates on top row" text and sort by Y position
            const pageTextsDates = pageTexts
              .filter((text: any) => text.R.find((r: any) => r.T === "Enter%20dates%20on%20top%20row%20-%3E"))
              .sort((a: any, b: any) => a.y - b.y);

            let topicsData = [];

            // Process topics based on filtered date rows
            for (let i = 0; i < pageTextsDates.length; i++) {
              const currpageTextDate = pageTextsDates[i];
              const nextpageTextDate = pageTextsDates[i + 1];

              let newTopicData: any = {
                dateBox: {
                  startX: currpageTextDate.x,
                  startY: currpageTextDate.y,
                  width: currpageTextDate.w,
                },
                accommodations: [],
              };

              // Handle the case where the next "Enter Date" is found
              if (nextpageTextDate) {
                const pageMinY = currpageTextDate.y;
                const pageMaxY = nextpageTextDate.y;

                const pageHLinesFiltered = pageHLines
                  .filter((line: any) => line.y > pageMinY && line.y < pageMaxY)
                  .sort((a: any, b: any) => a.y - b.y);

                newTopicData.accommodations = pageHLinesFiltered;
              } else {
                // Handle the last topic
                const pageMinY = currpageTextDate.y;
                const pageHLinesFiltered = pageHLines
                  .filter((line: any) => line.y > pageMinY)
                  .sort((a: any, b: any) => a.y - b.y);

                newTopicData.accommodations = pageHLinesFiltered;
              }

              topicsData.push(newTopicData);
            }

            // Add parsed page data to the array
            pagesDataArr.push({
              width: page.Width,
              height: page.Height,
              lastVLine: pageLastVLine || { x: null },
              topics: topicsData,
            });

            // Check for signature page
            const foundSignaturePageIndex = pageTexts.findIndex((text: any) => {
              return text.R.find(
                (r: any) => r.T === "I%20certify%20that%20the%20above%20information%20is%20true%20and%20correct"
              );
            });

            if (foundSignaturePageIndex > -1) {
              pagesDataArr[pageNum] = {
                ...pagesDataArr[pageNum],
                isSignaturePage: true,
                signatureText: pageTexts[foundSignaturePageIndex],
              };
            }
          });

          // Send the response after the parsing is complete
          return response.status(200).json({
            success: true,
            d: {
              pages: pagesDataArr,
            },
          });
        } catch (err) {
          console.error("Error during PDF parsing:", err);
          return response.status(500).json({ success: false, error: "Error during PDF parsing." });
        }
      });

      pdfParser.on("pdfParser_dataError", (err: any) => {
        console.error("PDF Parser error:", err);
        return response.status(500).json({ success: false, error: "Error in PDF file." });
      });

      // Parse the PDF buffer
      pdfParser.parseBuffer(pdfBuffer);

    } catch (err) {
      console.error("Error while processing PDF:", err);
      return response.status(500).json({ success: false, error: "Error while processing PDF." });
    }
  });
}