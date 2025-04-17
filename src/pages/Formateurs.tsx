import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NouvellePage from './formateurs/NouvellePage';
import ListePage from './formateurs/ListePage';

export default function Formateurs() {
  return (
    <Routes>
      <Route path="nouveau" element={<NouvellePage />} />
      <Route path="liste" element={<ListePage />} />
    </Routes>
  );
}