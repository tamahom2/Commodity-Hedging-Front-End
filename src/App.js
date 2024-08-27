import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import HedgingSimulation from './HedgingSimulation';
import Dashboard from './Dashboard';
import MonthlyPrices from './MonthlyPrices';
import ContractPricing from './ContractPricing';
import Backtest from './Backtest';

const AppContainer = styled.div`
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  background-color: #282c34;
  padding: 20px;
  color: white;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  padding: 10px;
  background-color: #f8f9fa;
`;

const NavLink = styled(Link)`
  margin: 0 10px;
  text-decoration: none;
  color: #007bff;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }
`;



function App() {
  return (
    <Router>
      <AppContainer>
        <Header>
          <h1>Hedging Strategy Application</h1>
        </Header>
        <Nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/monthly-prices">Monthly Prices</NavLink>
          <NavLink to="/hedging-simulation">Hedging Simulation</NavLink>
          <NavLink to="/backtest">Backtest</NavLink>
          <NavLink to="/contract-pricing">Contract Pricing</NavLink>
        </Nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/monthly-prices" element={<MonthlyPrices />} />
          <Route path="/hedging-simulation" element={<HedgingSimulation />} />
          <Route path="/backtest" element={<Backtest />} /> 
          <Route path="/contract-pricing" element={<ContractPricing />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;