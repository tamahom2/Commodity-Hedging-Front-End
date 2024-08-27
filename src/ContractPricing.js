import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const PricingContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Title = styled.h2`
  color: #333;
  text-align: center;
`;

const OptionSelector = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
`;

const OptionButton = styled.button`
  padding: 10px 15px;
  background-color: ${props => props.selected ? '#007bff' : '#f8f9fa'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 1px solid #007bff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.selected ? '#0056b3' : '#e2e6ea'};
  }
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

const Button = styled.button`
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #218838;
  }
`;

const ResultContainer = styled.div`
  margin-top: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
`;

const optionTypes = [
    { name: 'Vanilla', value: 'vanilla' },
    { name: 'Asian', value: 'asian' },
    { name: 'Barrier', value: 'barrier' },
    { name: 'Double Barrier', value: 'doubleBarrier' },
    { name: 'Lookback', value: 'lookback' },
  ];
  
  const vanillaFunctions = [
    { name: 'Black-Scholes', value: 'blackScholes' },
    { name: 'General Black-Scholes', value: 'generalBlackScholes' },
    { name: 'Monte Carlo', value: 'monteCarlo' },
    { name: 'Black 76', value: 'black76' },
  ];
  
  const asianFunctions = [
    { name: 'Geometric Average Rate', value: 'geometricAverageRate' },
    { name: 'Turnbull Wakeman', value: 'turnbullWakeman' },
    { name: 'Levy Asian', value: 'levyAsian' },
    { name: 'Monte Carlo Geometric', value: 'monteCarloGeometric' },
    { name: 'Monte Carlo Arithmetic', value: 'monteCarloArithmetic' },
  ];

  const barrierTypes = [
    { name: 'Call Down-and-In', value: 'cdi' },
    { name: 'Call Up-and-In', value: 'cui' },
    { name: 'Put Down-and-In', value: 'pdi' },
    { name: 'Put Up-and-In', value: 'pui' },
    { name: 'Call Down-and-Out', value: 'cdo' },
    { name: 'Call Up-and-Out', value: 'cuo' },
    { name: 'Put Down-and-Out', value: 'pdo' },
    { name: 'Put Up-and-Out', value: 'puo' },
  ];
  
  const doubleBarrierTypes = [
    { name: 'Call Out', value: 'co' },
    { name: 'Put Out', value: 'po' },
    { name: 'Call In', value: 'ci' },
    { name: 'Put In', value: 'pi' },
  ];
  

  const ContractPricing = () => {
    const [selectedOption, setSelectedOption] = useState('vanilla');
    const [selectedFunction, setSelectedFunction] = useState('');
    const [barrierType, setBarrierType] = useState('');

    const [inputs, setInputs] = useState({
      S: '',
      K: '',
      T: '',
      r: '',
      b: '',
      v: '',
      optionType: 'c',
      barrier: '',
      lowerBarrier: '',
      upperBarrier: '',
      SA: '', // For Asian options
      T2: '', // For Asian options
      tau: '', // For Asian options
      numSimulations: '10000', // For Monte Carlo
      numSteps: '252', // For Monte Carlo
    });
    const [result, setResult] = useState(null);
  
    const handleOptionSelect = (option) => {
      setSelectedOption(option);
      setSelectedFunction('');
      setResult(null);
    };
  
    const handleFunctionSelect = (func) => {
      setSelectedFunction(func);
      setResult(null);
    };
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInputs(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        const requestData = {
          optionType: selectedOption,
          pricingFunction: selectedFunction,
          barrierType: barrierType,
          callPutFlag: inputs.optionType,
          S: parseFloat(inputs.S),
          K: parseFloat(inputs.K),
          T: parseFloat(inputs.T),
          r: parseFloat(inputs.r),
          b: parseFloat(inputs.b),
          v: parseFloat(inputs.v),
          barrier: inputs.barrier ? parseFloat(inputs.barrier) : null,
          lowerBarrier: inputs.lowerBarrier ? parseFloat(inputs.lowerBarrier) : null,
          upperBarrier: inputs.upperBarrier ? parseFloat(inputs.upperBarrier) : null,
          SA: inputs.SA ? parseFloat(inputs.SA) : null,
          T2: inputs.T2 ? parseFloat(inputs.T2) : null,
          tau: inputs.tau ? parseFloat(inputs.tau) : null,
          numSimulations: parseInt(inputs.numSimulations),
          numSteps: parseInt(inputs.numSteps),
        };
        console.log('Sending request:', JSON.stringify(requestData, null, 2));
        try {
          const response = await axios.post('/api/price-contract', requestData);
          console.log('Received response:', response.data);
          setResult(response.data);
        } catch (error) {
          console.error('Error pricing contract:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
          }
          setResult({ error: error.response?.data?.error || 'An error occurred while pricing the contract.' });
        }
      };
  
    return (
      <PricingContainer>
        <Title>Contract Pricing</Title>
        <OptionSelector>
          {optionTypes.map(option => (
            <OptionButton 
              key={option.value}
              selected={selectedOption === option.value}
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.name}
            </OptionButton>
          ))}
        </OptionSelector>
        {(selectedOption === 'vanilla' || selectedOption === 'asian') && (
          <OptionSelector>
            {(selectedOption === 'vanilla' ? vanillaFunctions : asianFunctions).map(func => (
              <OptionButton
                key={func.value}
                selected={selectedFunction === func.value}
                onClick={() => handleFunctionSelect(func.value)}
              >
                {func.name}
              </OptionButton>
            ))}
          </OptionSelector>
        )}
        <Form onSubmit={handleSubmit}>
          <Input
            type="number"
            name="S"
            value={inputs.S}
            onChange={handleInputChange}
            placeholder="Spot Price (S)"
            required
          />
          <Input
            type="number"
            name="K"
            value={inputs.K}
            onChange={handleInputChange}
            placeholder="Strike Price (K)"
            required
          />
          <Input
            type="number"
            name="T"
            value={inputs.T}
            onChange={handleInputChange}
            placeholder="Time to Maturity (T) in years"
            required
          />
          <Input
            type="number"
            name="r"
            value={inputs.r}
            onChange={handleInputChange}
            placeholder="Risk-free Rate (r)"
            required
          />
          <Input
            type="number"
            name="b"
            value={inputs.b}
            onChange={handleInputChange}
            placeholder="Cost of Carry (b)"
            required
          />
          <Input
            type="number"
            name="v"
            value={inputs.v}
            onChange={handleInputChange}
            placeholder="Volatility (v)"
            required
          />
          {selectedOption !== 'barrier' && selectedOption !== 'doubleBarrier' && (
          <select name="optionType" value={inputs.optionType} onChange={handleInputChange}>
            <option value="c">Call</option>
            <option value="p">Put</option>
          </select>
        )}
          {selectedOption === 'asian' && (
            <>
              <Input
                type="number"
                name="SA"
                value={inputs.SA}
                onChange={handleInputChange}
                placeholder="Average Price (SA)"
              />
              <Input
                type="number"
                name="T2"
                value={inputs.T2}
                onChange={handleInputChange}
                placeholder="Time to Average Start (T2)"
              />
              <Input
                type="number"
                name="tau"
                value={inputs.tau}
                onChange={handleInputChange}
                placeholder="Tau"
              />
            </>
          )}
          
        {selectedOption === 'barrier' && (
          <>
            <select name="barrierType" value={barrierType} onChange={(e) => setBarrierType(e.target.value)}>
              <option value="">Select Barrier Type</option>
              {barrierTypes.map(type => (
                <option key={type.value} value={type.value}>{type.name}</option>
              ))}
            </select>
            <Input
              type="number"
              name="barrier"
              value={inputs.barrier}
              onChange={handleInputChange}
              placeholder="Barrier"
              required
            />
          </>
        )}
        {selectedOption === 'doubleBarrier' && (
          <>
            <select name="barrierType" value={barrierType} onChange={(e) => setBarrierType(e.target.value)}>
              <option value="">Select Double Barrier Type</option>
              {doubleBarrierTypes.map(type => (
                <option key={type.value} value={type.value}>{type.name}</option>
              ))}
            </select>
            <Input
              type="number"
              name="lowerBarrier"
              value={inputs.lowerBarrier}
              onChange={handleInputChange}
              placeholder="Lower Barrier"
              required
            />
            <Input
              type="number"
              name="upperBarrier"
              value={inputs.upperBarrier}
              onChange={handleInputChange}
              placeholder="Upper Barrier"
              required
            />
          </>
        )}
          {(selectedFunction === 'monteCarlo' || selectedFunction === 'monteCarloGeometric' || selectedFunction === 'monteCarloArithmetic') && (
            <>
              <Input
                type="number"
                name="numSimulations"
                value={inputs.numSimulations}
                onChange={handleInputChange}
                placeholder="Number of Simulations"
              />
              <Input
                type="number"
                name="numSteps"
                value={inputs.numSteps}
                onChange={handleInputChange}
                placeholder="Number of Steps"
              />
            </>
          )}
          <Button type="submit">Price Contract</Button>
        </Form>
        {result && (
          <ResultContainer>
            <h3>Pricing Result:</h3>
            {result.error ? (
              <p>Error: {result.error}</p>
            ) : (
              <p>Contract Price: ${result.price.toFixed(2)}</p>
            )}
          </ResultContainer>
        )}
      </PricingContainer>
    );
  };
  
  export default ContractPricing;