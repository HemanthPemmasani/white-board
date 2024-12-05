import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentText, setCurrentText] = useState("");
  const [textPosition, setTextPosition] = useState(null);
  const [lineHeight, setLineHeight] = useState(30);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);

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

  useEffect(() => {
    const handleKeyModifiers = (e) => {
      setIsCapsLock(e.getModifierState("CapsLock"));
      setShiftPressed(e.shiftKey);
    };

    window.addEventListener("keydown", handleKeyModifiers);
    window.addEventListener("keyup", handleKeyModifiers);

    return () => {
      window.removeEventListener("keydown", handleKeyModifiers);
      window.removeEventListener("keyup", handleKeyModifiers);
    };
  }, []);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "text") {
      if (!textPosition) {
        setTextPosition({ offsetX, offsetY });
        setCurrentText("");
      }
    } else {
      setStartPoint({ offsetX, offsetY });
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
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || tool === "text") return;

    const { offsetX, offsetY } = e.nativeEvent;
    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => {
        const lastElement = prevElements[prevElements.length - 1];
        const updatedElement = {
          ...lastElement,
          path: [...lastElement.path, [offsetX, offsetY]],
        };
        return [...prevElements.slice(0, -1), updatedElement];
      });
    } else if (tool === "line" || tool === "rect") {
      const { offsetX: startX, offsetY: startY } = startPoint;
      setElements((prevElements) => {
        const updatedElement = {
          offsetX: startX,
          offsetY: startY,
          width: offsetX - startX,
          height: offsetY - startY,
          stroke: color,
          element: tool,
        };
        return [...prevElements.slice(0, -1), updatedElement];
      });
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (tool === "text" && textPosition) {
        let typedChar = e.key;

        if (e.key === "Enter") {
          setCurrentText((prevText) => prevText + "\n");
        } else if (e.key === "Backspace") {
          setCurrentText((prevText) => prevText.slice(0, -1));
        } else if (e.key === "Tab") {
          setCurrentText((prevText) => prevText + "  ");
        } else if (e.key.length === 1) {
          if (shiftPressed || isCapsLock) {
            typedChar = typedChar.toUpperCase();
          }
          setCurrentText((prevText) => prevText + typedChar);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [tool, textPosition, isCapsLock, shiftPressed]);

  useLayoutEffect(() => {
    const roughCanvas = rough.canvas(canvasRef.current);
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

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
          generator.line(ele.offsetX, ele.offsetY, ele.offsetX + ele.width, ele.offsetY + ele.height, {
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
        ele.text.split("\n").forEach((line, index) => {
          ctx.current.fillText(line, ele.offsetX, ele.offsetY + index * lineHeight);
        });
      }
    });

    if (textPosition && currentText) {
      const textLines = currentText.split("\n");
      let yOffset = textPosition.offsetY;

      ctx.current.font = "20px Arial";
      ctx.current.fillStyle = color;

      textLines.forEach((line) => {
        ctx.current.fillText(line, textPosition.offsetX, yOffset);
        yOffset += lineHeight;
      });
    }

    const canvasImage = canvasRef.current.toDataURL();
    socket.emit("drawing", canvasImage);
  }, [elements, currentText, textPosition]);

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);

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

  return (
    <div>
      <div
        className="border border-dark px-0 mt-3 ml-3"
        style={{ height: "500px", width: "750px", marginLeft: "100px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => handleMouseMove(e)}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default Canvas;