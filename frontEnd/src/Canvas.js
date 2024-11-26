import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import jsPDF from "jspdf";

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentText, setCurrentText] = useState("");  // Holds current text being typed
  const [textPosition, setTextPosition] = useState(null); // Text insertion position
  const [lineHeight, setLineHeight] = useState(30);  // For line spacing

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.height = window.innerHeight * 2;
    canvas.width = window.innerWidth * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const context = canvas.getContext("2d");

    context.strokeWidth = 5;
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = 5;
    ctx.current = context;
  }, []);

  useEffect(() => {
    ctx.current.strokeStyle = color;
  }, [color]);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: tool === "eraser" ? "white" : color,
          element: tool,
        },
      ]);
    } else if (tool === "text") {
      setTextPosition({ offsetX, offsetY });
      setCurrentText("");  // Clear the current text for new typing
    } else {
      setElements((prevElements) => [
        ...prevElements,
        { offsetX, offsetY, stroke: color, element: tool },
      ]);
    }

    setIsDrawing(true);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (tool === "text" && textPosition) {
        if (e.key === "Enter") {
          setCurrentText((prevText) => prevText + "\n");  // Add new line on Enter
        } else if (e.key === "Backspace") {
          // Fix: Backspace will now properly remove the last character
          setCurrentText((prevText) => prevText.slice(0, -1));
        } else {
          setCurrentText((prevText) => prevText + e.key);  // Add typed character
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [tool, textPosition]);

  useLayoutEffect(() => {
    const roughCanvas = rough.canvas(canvasRef.current);
    if (elements.length > 0) {
      ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Draw all elements, including text
    elements.forEach((ele) => {
      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "pencil" || ele.element === "eraser") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: 5,
        });
      } else if (ele.element === "text") {
        ctx.current.font = "20px Arial";
        ctx.current.fillStyle = ele.stroke;
        ctx.current.fillText(ele.text, ele.offsetX, ele.offsetY);
      }
    });

    // Draw the current text being typed (if any)
    if (textPosition && currentText) {
      const textLines = currentText.split("\n");
      let yOffset = textPosition.offsetY;

      ctx.current.font = "20px Arial";
      ctx.current.fillStyle = color;

      // Draw each line of text
      textLines.forEach((line) => {
        ctx.current.fillText(line, textPosition.offsetX, yOffset);
        yOffset += lineHeight;  // Move to the next line
      });
    }

    const canvasImage = canvasRef.current.toDataURL();
    socket.emit("drawing", canvasImage);
  }, [elements, currentText, textPosition]);

  const handleMouseMove = (e) => {
    if (!isDrawing || tool === "text") return;

    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "rect") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
                stroke: ele.stroke,
                element: ele.element,
              }
            : ele
        )
      );
    } else if (tool === "line") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                width: offsetX,
                height: offsetY,
                stroke: ele.stroke,
                element: ele.element,
              }
            : ele
        )
      );
    } else if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                path: [...ele.path, [offsetX, offsetY]],
                stroke: ele.stroke,
                element: ele.element,
              }
            : ele
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    // Save the typed text when the user stops drawing
    if (tool === "text" && currentText) {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX: textPosition.offsetX,
          offsetY: textPosition.offsetY,
          text: currentText,
          stroke: color,
          element: "text",
        },
      ]);
      setTextPosition(null);
      setCurrentText("");
    }
  };

  const exportToPDF = () => {
    const canvas = canvasRef.current;
    const pdf = new jsPDF("landscape");
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 140);
    pdf.save("drawing.pdf");
  };

  return (
    <div>
      {/* Canvas */}
      <div
        className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
        style={{ height: "500px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} />
      </div>

    </div>
  );
};

export default Canvas;
