import React from "react";
import ReactDOM from "react-dom";
import PortalApp from "./PortalApp"; // A separate React component for this page
import "./index.css"; // Reuse global styles


console.log("hi");
ReactDOM.render(
    <React.StrictMode>
        <PortalApp />
    </React.StrictMode>,
    document.getElementById("portal-root")
);
