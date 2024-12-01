import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Canvas from "./Canvas";
import jsPDF from "jspdf";
import Chatbox from "./Chatbox";

const Room = ({ userNo, socket, setUsers, setUserNo }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");
  const [eraserSize, setEraserSize] = useState(10); // New state for eraser size

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });
  }, []);

  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setElements([]);
  };

  const undo = () => {
    setHistory((prevHistory) => [
      ...prevHistory,
      elements[elements.length - 1],
    ]);
    setElements((prevElements) =>
      prevElements.filter((ele, index) => index !== elements.length - 1)
    );
  };

  const redo = () => {
    setElements((prevElements) => [
      ...prevElements,
      history[history.length - 1],
    ]);
    setHistory((prevHistory) =>
      prevHistory.filter((ele, index) => index !== history.length - 1)
    );
  };

  const exportToPDF = () => {
    const canvas = canvasRef.current;

    // Create a jsPDF instance
    const pdf = new jsPDF("landscape");

    // Convert the canvas to an image
    const imgData = canvas.toDataURL("image/png");

    // Add the image to the PDF
    pdf.addImage(imgData, "PNG", 10, 10, 280, 140);

    // Save the PDF
    pdf.save("drawing.pdf");
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <h1 className="display-5 pt-4 pb-3 text-center">
          React Drawing App - users online: {userNo}
        </h1>
      </div>
      <div className="row justify-content-center align-items-center text-center py-2">
        <div className="col-md-2">
          <div className="color-picker d-flex align-items-center justify-content-center">
            Color Picker : &nbsp;
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="pencil"
              value="pencil"
              checked={tool === "pencil"}
              onChange={(e) => setTool(e.target.value)}
            />
            <label className="form-check-label" htmlFor="pencil">
              Pencil
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="eraser"
              value="eraser"
              checked={tool === "eraser"}
              onChange={(e) => setTool(e.target.value)}  
            />
            <label className="form-check-label" htmlFor="eraser">
              Eraser
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="line"
              value="line"
              checked={tool === "line"}
              onChange={(e) => setTool(e.target.value)}
            />
            <label className="form-check-label" htmlFor="line">
              Line
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="rect"
              value="rect"
              checked={tool === "rect"}
              onChange={(e) => setTool(e.target.value)}
            />
            <label className="form-check-label" htmlFor="rect">
              Rectangle
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="text"
              value="text"
              checked={tool === "text"}
              onChange={(e) => setTool(e.target.value)}
            />
            <label className="form-check-label" htmlFor="text">
              Text
            </label>
          </div>
        </div>
        <div className="col-md-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={elements.length === 0}
            onClick={() => undo()}
          >
            Undo
          </button>
          &nbsp;&nbsp;
          <button
            type="button"
            className="btn btn-outline-primary ml-1"
            disabled={history.length < 1}
            onClick={() => redo()}
          >
            Redo
          </button>
        </div>
        <div className="col-md-1">
          <div className="color-picker d-flex align-items-center justify-content-center">
            <input
              type="button"
              className="btn btn-danger"
              value="clear canvas"
              onClick={clearCanvas}
            />
          </div>
        </div>
        <button
          onClick={exportToPDF}
          style={{
            marginLeft: "3px",
            fontSize: "16px",
            height: "37px",
            width: "120px",
            backgroundColor: "blue",
            color: "white",
          }}
        >
          DownloadPDF
        </button>
      </div>
      {/* Display the eraser size slider below the tool selection */}
      {tool === "eraser" && (
        <div className="row justify-content-center mt-3">
          <div className="col-md-3">
            <label htmlFor="eraser-size" className="form-label">
              Eraser Size
            </label>
            <input
              type="range"
              id="eraser-size"
              min="5"
              max="50"
              step="1"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <Canvas
            canvasRef={canvasRef}
            ctx={ctx}
            color={color}
            setElements={setElements}
            elements={elements}
            tool={tool}
            socket={socket}
            eraserSize={eraserSize} // Pass eraser size to Canvas component
          />
        </div>
        <div>
          <Chatbox socket={socket} />
        </div>
      </div>
    </div>
  );
};

export default Room;                      




// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import Canvas from "./Canvas";
// import jsPDF from "jspdf";
// import Chatbox from "./Chatbox";

// const Room = ({ userNo, socket, setUsers, setUserNo }) => {
//   const canvasRef = useRef(null);
//   const ctx = useRef(null);
//   const [color, setColor] = useState("#000000");
//   const [elements, setElements] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [tool, setTool] = useState("pencil");
//   const [eraserSize, setEraserSize] = useState(10);

//   useEffect(() => {
//     socket.on("message", (data) => {
//       toast.info(data.message);
//     });
//   }, []);

//   useEffect(() => {
//     socket.on("users", (data) => {
//       setUsers(data);
//       setUserNo(data.length);
//     });
//   }, []);

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");
//     context.fillStyle = "white";
//     context.fillRect(0, 0, canvas.width, canvas.height);
//     setElements([]);
//   };

//   const undo = () => {
//     setHistory((prevHistory) => [
//       ...prevHistory,
//       elements[elements.length - 1],
//     ]);
//     setElements((prevElements) =>
//       prevElements.filter((ele, index) => index !== elements.length - 1)
//     );
//   };

//   const redo = () => {
//     setElements((prevElements) => [
//       ...prevElements,
//       history[history.length - 1],
//     ]);
//     setHistory((prevHistory) =>
//       prevHistory.filter((ele, index) => index !== history.length - 1)
//     );
//   };

//   const exportToPDF = () => {
//     const canvas = canvasRef.current;
//     const pdf = new jsPDF("landscape");
//     const imgData = canvas.toDataURL("image/png");
//     pdf.addImage(imgData, "PNG", 10, 10, 280, 140);
//     pdf.save("drawing.pdf");
//   };

//   return (
//     <div className="container-fluid">
//       <div className="row">
//         <h1 className="display-5 pt-4 pb-3 text-center">
//           React Drawing App - users online: {userNo}
//         </h1>
//       </div>
//       <div className="row justify-content-center align-items-center text-center py-2">
//         <div className="col-md-2">
//           <div className="color-picker d-flex align-items-center justify-content-center">
//             Color Picker:&nbsp;
//             <input
//               type="color"
//               value={color}
//               onChange={(e) => setColor(e.target.value)}
//             />
//           </div>
//         </div>
//         <div className="col-md-4 text-center">
//           <label>Tools</label>
//           <div className="d-flex justify-content-center gap-2">
//             <label>
//               <input
//                 type="radio"
//                 name="tools"
//                 value="pencil"
//                 checked={tool === "pencil"}
//                 onChange={(e) => setTool(e.target.value)}
//               />
//               Pencil
//             </label>
//             <label>
//               <input
//                 type="radio"
//                 name="tools"
//                 value="eraser"
//                 checked={tool === "eraser"}
//                 onChange={(e) => setTool(e.target.value)}
//               />
//               Eraser
//             </label>
//             <label>
//               <input
//                 type="radio"
//                 name="tools"
//                 value="line"
//                 checked={tool === "line"}
//                 onChange={(e) => setTool(e.target.value)}
//               />
//               Line
//             </label>
//             <label>
//               <input
//                 type="radio"
//                 name="tools"
//                 value="rect"
//                 checked={tool === "rect"}
//                 onChange={(e) => setTool(e.target.value)}
//               />
//               Rectangle
//             </label>
//             <label>
//               <input
//                 type="radio"
//                 name="tools"
//                 value="text"
//                 checked={tool === "text"}
//                 onChange={(e) => setTool(e.target.value)}
//               />
//               Text
//             </label>
//           </div>
//         </div>
//         <div className="col-md-2">
//           <button
//             type="button"
//             className="btn btn-outline-primary"
//             disabled={elements.length === 0}
//             onClick={() => undo()}
//           >
//             Undo
//           </button>
//           &nbsp;&nbsp;
//           <button
//             type="button"
//             className="btn btn-outline-primary"
//             disabled={history.length < 1}
//             onClick={() => redo()}
//           >
//             Redo
//           </button>
//         </div>
//         <div className="col-md-1">
//           <div className="color-picker d-flex align-items-center justify-content-center">
//             <input
//               type="button"
//               className="btn btn-danger"
//               value="Clear Canvas"
//               onClick={clearCanvas}
//             />
//           </div>
//         </div>
//         <button
//           onClick={exportToPDF}
//           style={{
//             marginLeft: "3px",
//             fontSize: "16px",
//             height: "39px",
//             width: "120px",
//             backgroundColor: "blue",
//             color: "white",
//           }}
//         >
//           PDF
//         </button>
//       </div>
//       {tool === "eraser" && (
//         <div className="row justify-content-center mt-3">
//           <div className="col-md-3">
//             <label htmlFor="eraser-size" className="form-label">
//               Eraser Size
//             </label>
//             <input
//               type="range"
//               id="eraser-size"
//               min="5"
//               max="50"
//               step="1"
//               value={eraserSize}
//               onChange={(e) => setEraserSize(Number(e.target.value))}
//               style={{ width: "100%" }}
//             />
//           </div>
//         </div>
//       )}
//       <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
//         <div>
//           <Canvas
//             canvasRef={canvasRef}
//             ctx={ctx}
//             color={color}
//             setElements={setElements}
//             elements={elements}
//             tool={tool}
//             socket={socket}
//             eraserSize={eraserSize}
//           />
//         </div>
//         <div>
//           <Chatbox socket={socket} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;
