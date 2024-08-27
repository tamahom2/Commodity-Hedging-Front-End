import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const BacktestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  margin-top: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
`;

const ErrorMessage = styled.p`
  color: red;
  font-weight: bold;
`;

const Backtest = () => {
    const [inputs, setInputs] = useState({
      strategy: 'put',
      eprms: '',
      pdd: '',
      spread: '',
      interestRate: '',
      volatility: '',
      slope: '',
      initialPrice: '',
      swapRate: '',
      putPercentage: '',
      collarLowerBound: '',
      collarUpperBound: '',
      hedgedVolume: '',
      monthlyData: Array(12).fill().map(() => ({ price: '', maturity: '' })),
    });
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInputs(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleMonthlyDataChange = (index, field, value) => {
      setInputs(prev => {
        const newMonthlyData = [...prev.monthlyData];
        newMonthlyData[index] = { ...newMonthlyData[index], [field]: value };
        return { ...prev, monthlyData: newMonthlyData };
      });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
  
      try {
        const response = await axios.post('/api/backtest', {
          strategy: inputs.strategy,
          eprms: parseFloat(inputs.eprms),
          pdd: parseFloat(inputs.pdd),
          spread: parseFloat(inputs.spread),
          interestRate: parseFloat(inputs.interestRate),
          volatility: parseFloat(inputs.volatility),
          slope: parseFloat(inputs.slope),
          initialPrice: parseFloat(inputs.initialPrice),
          swapRate: parseFloat(inputs.swapRate),
          putPercentage: parseFloat(inputs.putPercentage),
          collarLowerBound: parseFloat(inputs.collarLowerBound),
          collarUpperBound: parseFloat(inputs.collarUpperBound),
          hedgedVolume: parseFloat(inputs.hedgedVolume),
          monthlyData: inputs.monthlyData.map(data => ({
            price: parseFloat(data.price),
            maturity: parseInt(data.maturity),
          })),
        });
  
        setResults(response.data);
      } catch (err) {
        setError('An error occurred while running the backtest. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
  
  
    return (
      <BacktestContainer>
        <h2>Hedging Strategy Backtest</h2>
        <Form onSubmit={handleSubmit}>
          <Select
            name="strategy"
            value={inputs.strategy}
            onChange={handleInputChange}
          >
            <option value="put">Put</option>
            <option value="swap">Swap</option>
            <option value="collar">Collar</option>
          </Select>
          <Input
            type="number"
            name="eprms"  
            value={inputs.eprms}
            onChange={handleInputChange}
            placeholder="EPRMS"
            step="0.01"
            />
          <Input
            type="number"
            name="pdd"
            value={inputs.pdd}
            onChange={handleInputChange}
            placeholder="PDD"
            step="0.01"
          />
          <Input
            type="number"
            name="spread"
            value={inputs.spread}
            onChange={handleInputChange}
            placeholder="Spread"
            step="0.01"
          />
          <Input
            type="number"
            name="interestRate"
            value={inputs.interestRate}
            onChange={handleInputChange}
            placeholder="Interest Rate"
            step="0.01"
          />
          <Input
            type="number"
            name="volatility"
            value={inputs.volatility}
            onChange={handleInputChange}
            placeholder="Volatility"
            step="0.01"
          />
          <Input
            type="number"
            name="slope"
            value={inputs.slope}
            onChange={handleInputChange}
            placeholder="Slope"
            step="0.01"
          />
          <Input
            type="number"
            name="initialPrice"
            value={inputs.initialPrice}
            onChange={handleInputChange}
            placeholder="Initial Price"
            step="0.01"
          />
          <Input
            type="number"
            name="swapRate"
            value={inputs.swapRate}
            onChange={handleInputChange}
            placeholder="Swap Rate"
            step="0.01"
          />
          {inputs.strategy === 'put' && (
            <Input
              type="number"
              name="putPercentage"
              value={inputs.putPercentage}
              onChange={handleInputChange}
              placeholder="Put Percentage"
              step="0.01"
            />
          )}
          {inputs.strategy === 'collar' && (
            <>
              <Input
                type="number"
                name="collarLowerBound"
                value={inputs.collarLowerBound}
                onChange={handleInputChange}
                placeholder="Collar Lower Bound"
                step="0.01"
              />
              <Input
                type="number"
                name="collarUpperBound"
                value={inputs.collarUpperBound}
                onChange={handleInputChange}
                placeholder="Collar Upper Bound"
                step="0.01"
              />
            </>
          )}
          <Input
            type="number"
            name="hedgedVolume"
            value={inputs.hedgedVolume}
            onChange={handleInputChange}
            placeholder="Hedged Volume"
            step="0.01"
          />
          
          <h3>Monthly Data</h3>
        {inputs.monthlyData.map((data, index) => (
          <div key={index}>
            <Input
              type="number"
              value={data.price}
              onChange={(e) => handleMonthlyDataChange(index, 'price', e.target.value)}
              placeholder={`Month ${index + 1} Price`}
              step="0.01"
            />
            <Input
              type="number"
              value={data.maturity}
              onChange={(e) => handleMonthlyDataChange(index, 'maturity', e.target.value)}
              placeholder={`Month ${index + 1} Maturity (days)`}
            />
          </div>
        ))}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </Form>
  
        {error && <ErrorMessage>{error}</ErrorMessage>}
  
        {results && (
          <ResultsContainer>
            <h3>Backtest Results</h3>
            <p>Total Hedged Cost: ${results.totalHedgedCost.toFixed(2)}</p>
            <p>Total Unhedged Cost: ${results.totalUnhedgedCost.toFixed(2)}</p>
            <p>Total Premium: ${results.totalPremium.toFixed(2)}</p>
            <p>P&L: ${results.pnl.toFixed(2)}</p>
            <p>Cost Reduction: {((results.pnl / results.totalUnhedgedCost) * 100).toFixed(2)}%</p>
          </ResultsContainer>
        )}
      </BacktestContainer>
    );
  };
  
  export default Backtest;