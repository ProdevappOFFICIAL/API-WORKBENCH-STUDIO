import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home.page";
import NotFound from "./pages/notfound.page";
import LayoutWrapper from "./layoutWrapper";
import RequestComposer from "./pages/home.page";
function App() {
  return (
    <LayoutWrapper>
      <div className="flex flex-col h-full w-full items-center justify-center ">
        <Routes>
          <Route path="/" element={<RequestComposer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </LayoutWrapper>
  );
}

export default App;
