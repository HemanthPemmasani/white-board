import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentText, setCurrentText] = useState(""); // For text typing
  const [textPosition, setTextPosition] = useState(null); // Position for text
  const [lineHeight, setLineHeight] = useState(30); // Line spacing

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.height = window.innerHeight * 2;
    canvas.width = window.innerWidth * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    ctx.current = context;
  }, [canvasRef, ctx]);

  useEffect(() => {
    ctx.current.strokeStyle = color;
    ctx.current.fillStyle = color;
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
    } else if (tool === "line" || tool === "rect") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          width: 0,
          height: 0,
          stroke: color,
          element: tool,
        },
      ]);
    } else if (tool === "text") {
      finalizeText(); // Save any ongoing text
      setTextPosition({ offsetX, offsetY });
      setCurrentText(""); // Start typing fresh text
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                path: [...ele.path, [offsetX, offsetY]],
              }
            : ele
        )
      );
    } else if (tool === "line") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: offsetX,
                height: offsetY,
              }
            : ele
        )
      );
    } else if (tool === "rect") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
              }
            : ele
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (tool === "text") {
      finalizeText(); // Save the text on mouse up
    }
  };

  const finalizeText = () => {
    if (tool === "text" && textPosition && currentText) {
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

  const handleKeyPress = (e) => {
    if (tool === "text" && textPosition) {
      if (e.key === "Enter") {
        setCurrentText((prev) => prev + "\n"); // Add newline
      } else if (e.key === "Backspace") {
        setCurrentText((prev) => prev.slice(0, -1)); // Remove last character
      } else if (e.key.length === 1) {
        setCurrentText((prev) => prev + e.key); // Add character
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [tool, textPosition]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return; // Check if canvas or context is not available

    const roughCanvas = rough.canvas(canvas);
    ctx.current.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas only if context exists

    elements.forEach((ele) => {
      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 2,
          })
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 2,
          })
        );
      } else if (ele.element === "pencil" || ele.element === "eraser") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: 2,
        });
      } else if (ele.element === "text") {
        const lines = ele.text.split("\n");
        let yOffset = ele.offsetY;

        ctx.current.font = "20px Arial";
        ctx.current.fillStyle = ele.stroke;

        lines.forEach((line) => {
          ctx.current.fillText(line, ele.offsetX, yOffset);
          yOffset += lineHeight;
        });
      }
    });

    // Draw the current text being typed
    if (textPosition && currentText) {
      const lines = currentText.split("\n");
      let yOffset = textPosition.offsetY;

      ctx.current.font = "20px Arial";
      ctx.current.fillStyle = color;

      lines.forEach((line) => {
        ctx.current.fillText(line, textPosition.offsetX, yOffset);
        yOffset += lineHeight;
      });
    }
  }, [elements, currentText, textPosition, color, lineHeight, canvasRef, ctx]);

  return (
    <div>
      <div
        className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
        style={{
          height: "500px",
          width: "1100px",
          marginLeft: "100px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        tabIndex="0" // Ensures focus for keyboard events
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default Canvas;






