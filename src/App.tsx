import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import BlogAdmin from "./pages/BlogAdmin";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/blog"
          element={
            <AdminRoute>
              <BlogAdmin />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/admin/blog" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;