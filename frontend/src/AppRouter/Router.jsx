import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ComplaintForm from "../pages/ComplaintPage";
import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";
import ComplaintTrackingPage from "../pages/ComplaintTrackingPage";
import OfficerLoginPage from "../pages/OfficerLoginPage";
import OfficerDashboardPage from "../pages/dashboard";
import ComplaintDetailPage from "../pages/ViewDetailPage";
import FAQPage from "../pages/FaqPage";

import OfficerLayout from "../components/OfficerLayout";
const Router = () => {
  return (
    <BrowserRouter>
    
      <Routes>
        <Route element={<OfficerLayout />} >
        <Route path="/officer/dashboard" element = {<OfficerDashboardPage />} />
        <Route path="/officer/complaints/:id" element = {<ComplaintDetailPage />} />
        </Route>
        
        <Route path="/officer/login" element = {<OfficerLoginPage />} />
        
        
        <Route element={<Layout />}>
          <Route path="/register-complaint" element={<ComplaintForm />} />
          
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/" element={<HomePage />} />
          
          <Route path="/track-complaint" element={<ComplaintTrackingPage />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;