import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CreateComplaint from "./pages/CreateComplaint";
import ComplaintDetails from "./pages/ComplaintDetails";
import StaffDashboard from "./pages/StaffDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/complaints/new"
          element={<CreateComplaint />}
        />
        <Route
          path="/complaints/:id"
          element={<ComplaintDetails />}
        />
        <Route
          path="/staff-dashboard"
          element={<StaffDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;