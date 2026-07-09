import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorShard from "./components/ErrorShard.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorShard>
      <App />
    </ErrorShard>
  </React.StrictMode>
);
