// Make sure you have these imports at the top of your file
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, ImageRun } from "docx";
import { saveAs } from "file-saver";

export const generateFromUrl = async(imageUrl) => {
   let image = await fetch(
      imageUrl,
    )
    return await image.blob();
  }

export const exportAnalysisToDocx = async (screens) => {
  try {
    // Check if screens is provided    
    // Handle both single screen object and array of screens
    let screensArray = Array.isArray(screens) ? screens : [screens];
    
    if (screensArray.length === 0) {
      throw new Error("No screens data provided");
    }
    
    const children = [];
    // Add document title
    children.push(
      new Paragraph({ 
        text: "Screen Analysis Report", 
        heading: HeadingLevel.TITLE
      }),
      new Paragraph("") // Spacer
    );
  
    let hasContent = false;
    for(let [screenIndex, input ] of screensArray.entries()) {
      console.log("Processing screen data:", input,screenIndex);
    // screensArray.map(async(data, screenIndex) => {
      const imageUrl = input?.image?.secure_url || null; // Get image URL if available
      let bufferImg = null
      let image = null;
      if(imageUrl) {
        bufferImg = await generateFromUrl(imageUrl);
        image = new Paragraph({
          children: [
            new ImageRun({
              type: bufferImg.type.split("/")[1] || "png", // Default to PNG if type is not available
              data: bufferImg,
              transformation: {
                width: 640, // Set width as needed
                height: 480 // Set height as needed
              },
            }),
          ],
          alignment: "center", // Center the image
        })
      }
      let data = JSON.parse(input.screen); // Ensure data is parsed from string to object if needed
      // Screen Overview Section
      if (data?.screenOverview) {
        const o = data.screenOverview;
        children.push(
          new Paragraph(""),
          new Paragraph({ 
            text: `Screen ${screenIndex + 1}: ${o.screenName || 'Unnamed Screen'}`, 
            heading: HeadingLevel.HEADING_1 
          }),
          new Paragraph(`Type: ${o.screenType || 'Not specified'}`),
          new Paragraph(`Primary Purpose: ${o.primaryPurpose || 'Not specified'}`),
          new Paragraph(`User Role: ${o.userRole || 'Not specified'}`),
          new Paragraph(`Relation to Previous Screens: ${o.relationshipToPreviousScreens || 'Not specified'}`),
          new Paragraph(""),
          imageUrl ? image : new Paragraph("No image available for this screen."), // Add image if available
          new Paragraph("") // Spacer

        );
        hasContent = true;
      }

      // Requirements Matrix Table
      if (data?.requirementsMatrix?.length) {
        const headers = [
          "#", "Element", "Type", "Behavior", "Data Source", 
          "Validation Rules", "Error Handling", "Business Rules", "Notes"
        ];

        const tableRows = [
          new TableRow({
            children: headers.map(header => new TableCell({
              children: [new Paragraph({ text: header, bold: true })],
              shading: { fill: "E6E6E6" }
            })),
            tableHeader: true
          }),
          ...data.requirementsMatrix.map((requirement, index) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                new TableCell({ children: [new Paragraph(requirement?.uiElement || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.elementType || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.behavior || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.dataSource || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.validationRules || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.errorHandling || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.businessRules || 'N/A')] }),
                new TableCell({ children: [new Paragraph(requirement?.notes || 'N/A')] }),
              ]
            })
          )
        ];

        children.push(
          new Paragraph({ 
            text: "Requirements Matrix", 
            heading: HeadingLevel.HEADING_2 
          }),
          new Paragraph(""),
          new Paragraph(""),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 }
            }
          }),
          new Paragraph(""),
          new Paragraph("") // Spacer
          
        );
        hasContent = true;
      }

      // Helper function to append lists
      const appendList = (title, items) => {
        if (items?.length) {
          children.push(new Paragraph({ 
            text: title, 
            heading: HeadingLevel.HEADING_2 
          }));
          items.forEach((item, index) => {
            children.push(new Paragraph(`${index + 1}. ${item}`));
          });
          children.push(new Paragraph(""));
          hasContent = true;
        }
      };

      // Add other sections
      appendList("Functional Requirements", data?.functionalRequirements);
      appendList("Non-Functional Requirements", data?.nonFunctionalRequirements);
      appendList("Business Rules", data?.businessRules);
      appendList("Assumptions Made", data?.assumptionsMade);
    // });
    }
    // If no content was added, add a message
    if (!hasContent) {
      children.push(
        new Paragraph("No screen data available to export."),
        new Paragraph(""),
        new Paragraph("Please ensure your screens data contains:"),
        new Paragraph("- screenOverview object with screenName, screenType, etc."),
        new Paragraph("- requirementsMatrix array (optional)"),
        new Paragraph("- functionalRequirements array (optional)"),
        new Paragraph("- nonFunctionalRequirements array (optional)"),
        new Paragraph("- businessRules array (optional)"),
        new Paragraph("- assumptionsMade array (optional)")
      );
    }
    
    // Create the document
    const doc = new Document({
      sections: [{
        children,
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        }
      }]
    });
    
    // Generate and save the document
    const blob = await Packer.toBlob(doc);
    
    if (blob.size === 0) {
      throw new Error("Generated document is empty");
    }
    
    saveAs(blob, "ScreensAnalysis.docx");
    console.log("Document exported successfully");
    
  } catch (error) {
    console.error("Error exporting to DOCX:", error);
    alert(`Error exporting document: ${error.message}`);
  }
};