import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { HashRouter } from "react-router-dom";
import Header from "./components/header.component/header.component";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <main className="flex flex-col h-screen w-screen items-center justify-center bg-white rounded-md text-[10px] ">
        <Header />
        <App />
      </main>
    </HashRouter>
  </React.StrictMode>
);
