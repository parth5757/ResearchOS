import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Domain from './pages/Domain';
import Literature from './pages/Literature';
import Problems from './pages/Problems';
import Hypothesis from './pages/Hypothesis';
import Feasibility from './pages/Feasibility';
import Proposal from './pages/Proposal';
import Log from './pages/Log';
import Thesis from './pages/Thesis';

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/domain" element={<Domain />} />
            <Route path="/literature" element={<Literature />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/hypothesis" element={<Hypothesis />} />
            <Route path="/feasibility" element={<Feasibility />} />
            <Route path="/proposal" element={<Proposal />} />
            <Route path="/log" element={<Log />} />
            <Route path="/thesis" element={<Thesis />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="bottom-right"
          autoClose={2500}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </ProjectProvider>
    </BrowserRouter>
  );
}
