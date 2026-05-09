import React, { useState } from "react";
import Layout from "./components/Layout";
import ClassPage from "./pages/ClassPage";
import HomeworkPage from "./pages/HomeworkPage";
import TasksPage from "./pages/TasksPage";
import "./index.css";

export default function App() {
  const [activePage, setActivePage] = useState("class");

  const renderPage = () => {
    switch (activePage) {
      case "class":    return <ClassPage />;
      case "homework": return <HomeworkPage />;
      case "tasks":    return <TasksPage />;
      default:         return <ClassPage />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
}
