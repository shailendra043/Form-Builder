import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './App'
import FormBuilder from './FormBuilder'
import FormViewer from './FormViewer'
import ResponsesList from './ResponsesList'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/builder" element={<FormBuilder />} />
      <Route path="/form/:formId" element={<FormViewer />} />
      <Route path="/forms/:formId/responses" element={<ResponsesList />} />
    </Routes>
  </BrowserRouter>
)
