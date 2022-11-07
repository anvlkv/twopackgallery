import React from "react";
import {
  BrowserRouter
} from "react-router-dom";
import ThreeApp from "./components/ThreeApp";

export default function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThreeApp/>
      </BrowserRouter>
    </React.StrictMode>
  );
}
