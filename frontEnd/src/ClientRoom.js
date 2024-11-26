import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Chatbox from "./Chatbox";

const ClientRoom = ({ userNo, socket, setUsers, setUserNo }) => {
  const imgRef = useRef(null);

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

  useEffect(() => {
    socket.on("canvasImage", (data) => {
      imgRef.current.src = data;
    });
  }, []);

  return (
    <div className="container-fluid">
      <div className="row pb-2">
        <h1 className="display-5 pt-4 pb-3 text-center">
          React Drawing App - users online: {userNo}
        </h1>
      </div>

      {/* Flexbox to display image and chatbox side by side */}
      <div className="d-flex ml-3">
        {/* Left side: Canvas/Image */}
        <div className="col-md-7 mx-auto overflow-hidden border border-dark px-0  mt-3" style={{ height: "500px" }}>
          <img className="w-100 h-100" ref={imgRef} src="" alt="canvas" />
        </div>

        {/* Right side: Chatbox */}
        <div  className="col-md-3 ml-1">
          <Chatbox />
        </div>
      </div>
    </div>
  );
};

export default ClientRoom;
