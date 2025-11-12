import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import HomePage from './pages/HomePage';
import MathSubjectPage from './subjects/math/MathSubjectPage';
import KnowledgePointViewer from './subjects/math/components/KnowledgePointViewer';
import InteractiveLearningPage from './pages/InteractiveLearningPage';
import SubjectPage from './pages/SubjectPage';
import SubjectsOverviewPage from './pages/SubjectsOverviewPage';
import './styles/index.css';
import 'antd/dist/reset.css';

function App() {
  return (
    <ConfigProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* 学科概览页面 */}
          <Route path="/subjects" element={<SubjectsOverviewPage />} />

          {/* 旧的路由（保持兼容性） */}
          <Route path="/math" element={<MathSubjectPage />} />
          <Route path="/math/knowledge/:id" element={<KnowledgePointViewer />} />
          <Route path="/interactive/:subject" element={<InteractiveLearningPage />} />

          {/* 新的学科路由系统 */}
          <Route path="/subjects/:subject" element={<SubjectPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ConfigProvider>
  );
}

export default App;