import { Routes, Route } from "react-router-dom";
import LayoutWrapper from "./layoutWrapper";
import { mainRoutes } from "./constants/routes";
function App() {

  
  return (
    <LayoutWrapper>
        <Routes>
          {mainRoutes.map((route_name) => (
            <Route 
            path={route_name.path}
            element={
            <route_name.element/>
                    } 
            />
          ))}
        </Routes>
    </LayoutWrapper>
  );
}

export default App;
