import React, { useState, useCallback, useEffect, useReducer } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const SimulationContainer = styled.div`
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

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const OptionPrice = styled.span`
  margin-left: 10px;
  font-weight: bold;
`;

const DeleteButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
`;

const CalculateButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
`;

const initialState = {
  initialPrice: '',
  interestRate: '',
  scenario: {
    name: '',
    lowerBound: '',
    upperBound: '',
    probability: ''
  },
  monthlyStrategies: [{ volume: '', options: [] }]
};

// Reducer function
const inputsReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_SCENARIO':
      return { ...state, scenario: { ...state.scenario, [action.field]: action.value } };
    case 'ADD_MONTHLY_STRATEGY':
      return {
        ...state,
        monthlyStrategies: [...state.monthlyStrategies, { volume: '', options: [] }]
      };
    case 'UPDATE_MONTHLY_STRATEGY':
      return {
        ...state,
        monthlyStrategies: state.monthlyStrategies.map((strategy, index) =>
          index === action.monthIndex ? { ...strategy, [action.field]: action.value } : strategy
        )
      };
    case 'ADD_OPTION':
      return {
        ...state,
        monthlyStrategies: state.monthlyStrategies.map((strategy, index) =>
          index === action.monthIndex
            ? {
                ...strategy,
                options: [
                  ...strategy.options,
                  {
                    type: 'call',
                    strikePrice: '',
                    expiration: '',
                    impliedVolatility: '',
                    percentage: ''
                  }
                ]
              }
            : strategy
        )
      };
    case 'UPDATE_OPTION':
      return {
        ...state,
        monthlyStrategies: state.monthlyStrategies.map((strategy, strategyIndex) =>
          strategyIndex === action.monthIndex
            ? {
                ...strategy,
                options: strategy.options.map((option, optionIndex) =>
                  optionIndex === action.optionIndex
                    ? { ...option, [action.field]: action.value }
                    : option
                )
              }
            : strategy
        )
      };
    case 'DELETE_OPTION':
      return {
        ...state,
        monthlyStrategies: state.monthlyStrategies.map((strategy, strategyIndex) =>
          strategyIndex === action.monthIndex
            ? {
                ...strategy,
                options: strategy.options.filter((_, optionIndex) => optionIndex !== action.optionIndex)
              }
            : strategy
        )
      };
    default:
      return state;
  }
};

const HedgingSimulation = () => {
  const [inputs, dispatch] = useReducer(inputsReducer, initialState);
  const [optionPrices, setOptionPrices] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const handleScenarioChange = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_SCENARIO', field, value });
  }, []);

  const handleMonthlyStrategyChange = useCallback((monthIndex, field, value) => {
    dispatch({ type: 'UPDATE_MONTHLY_STRATEGY', monthIndex, field, value });
  }, []);

  const addMonthlyStrategy = useCallback(() => {
    dispatch({ type: 'ADD_MONTHLY_STRATEGY' });
  }, []);

  const addOption = useCallback((monthIndex) => {
    dispatch({ type: 'ADD_OPTION', monthIndex });
  }, []);

  const handleOptionChange = useCallback((monthIndex, optionIndex, field, value) => {
    dispatch({ type: 'UPDATE_OPTION', monthIndex, optionIndex, field, value });
    // Reset the price for this option
    setOptionPrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[`${monthIndex}-${optionIndex}`];
      return newPrices;
    });
  }, []);

  const deleteOption = useCallback((monthIndex, optionIndex) => {
    dispatch({ type: 'DELETE_OPTION', monthIndex, optionIndex });
  }, []);

  const calculateOptionPrice = useCallback(async (monthIndex, optionIndex) => {
    console.log('Inputs:', inputs);
    console.log(`Calculating price for option: ${monthIndex}-${optionIndex}`);
    const strategy = inputs.monthlyStrategies[monthIndex];
    console.log('Strategy:', strategy);
    const option = strategy?.options[optionIndex];
    console.log('Option:', option);
  
    if (
      option &&
      option.type &&
      option.strikePrice &&
      option.expiration &&
      option.impliedVolatility &&
      inputs.initialPrice &&
      inputs.interestRate
    ) {
      try {
        setIsLoading(true);
        console.log('Sending request to /api/option-price with data:', {
          type: option.type,
          strikePrice: parseFloat(option.strikePrice),
          expiration: parseInt(option.expiration),
          impliedVolatility: parseFloat(option.impliedVolatility),
          spotPrice: parseFloat(inputs.initialPrice),
          interestRate: parseFloat(inputs.interestRate)
        });
        const response = await axios.post('/api/option-price', {
          type: option.type,
          strikePrice: parseFloat(option.strikePrice),
          expiration: parseInt(option.expiration),
          impliedVolatility: parseFloat(option.impliedVolatility),
          spotPrice: parseFloat(inputs.initialPrice),
          interestRate: parseFloat(inputs.interestRate)
        });
        console.log('Received response:', response.data);
        if (response.data && response.data.price !== undefined) {
          setOptionPrices(prev => {
            const newPrices = {
              ...prev,
              [`${monthIndex}-${optionIndex}`]: response.data.price
            };
            console.log('Updated option prices:', newPrices);
            return newPrices;
          });
        } else {
          console.error('Invalid response:', response.data);
          setError('Received invalid response from server');
        }
      } catch (error) {
        console.error('Error calculating option price:', error);
        setError(`Failed to calculate option price: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Not all required fields are filled for option:', option);
    }
  }, [inputs]);

  useEffect(() => {
    inputs.monthlyStrategies.forEach((strategy, monthIndex) => {
      strategy.options.forEach((option, optionIndex) => {
        if (
          option.type &&
          option.strikePrice &&
          option.expiration &&
          option.impliedVolatility &&
          inputs.initialPrice &&
          inputs.interestRate
        ) {
          calculateOptionPrice(monthIndex, optionIndex);
        }
      });
    });
  }, [inputs.monthlyStrategies, inputs.initialPrice, inputs.interestRate, calculateOptionPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/hedging/simulate', {
        initialPrice: parseFloat(inputs.initialPrice),
        interestRate: parseFloat(inputs.interestRate),
        scenario: {
          name: inputs.scenario.name,
          lowerBound: parseFloat(inputs.scenario.lowerBound),
          upperBound: parseFloat(inputs.scenario.upperBound),
          probability: parseFloat(inputs.scenario.probability)
        },
        monthlyStrategies: inputs.monthlyStrategies.map(strategy => ({
          volume: parseFloat(strategy.volume),
          options: strategy.options.map(option => ({
            type: option.type,
            strikePrice: parseFloat(option.strikePrice),
            expiration: parseInt(option.expiration),
            impliedVolatility: parseFloat(option.impliedVolatility),
            percentage: parseFloat(option.percentage)
          }))
        }))
      });

      setResults(response.data);
    } catch (err) {
      setError('An error occurred while running the simulation. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SimulationContainer>
      <h2>Hedging Strategy Simulation</h2>
      <Form onSubmit={handleSubmit}>
        <Input
          type="number"
          value={inputs.initialPrice}
          onChange={(e) => handleInputChange('initialPrice', e.target.value)}
          placeholder="Initial Price"
        />
        <Input
          type="number"
          value={inputs.interestRate}
          onChange={(e) => handleInputChange('interestRate', e.target.value)}
          placeholder="Interest Rate"
          step="0.01"
        />
        
        <h3>Scenario</h3>
        <Input
          type="text"
          value={inputs.scenario.name}
          onChange={(e) => handleScenarioChange('name', e.target.value)}
          placeholder="Scenario Name"
        />
        <Input
          type="number"
          value={inputs.scenario.lowerBound}
          onChange={(e) => handleScenarioChange('lowerBound', e.target.value)}
          placeholder="Lower Bound"
        />
        <Input
          type="number"
          value={inputs.scenario.upperBound}
          onChange={(e) => handleScenarioChange('upperBound', e.target.value)}
          placeholder="Upper Bound"
        />
        <Input
          type="number"
          value={inputs.scenario.probability}
          onChange={(e) => handleScenarioChange('probability', e.target.value)}
          placeholder="Probability"
          step="0.01"
          min="0"
          max="1"
        />
        
        <h3>Monthly Strategies</h3>
        {inputs.monthlyStrategies.map((strategy, monthIndex) => (
          <div key={monthIndex}>
            <h4>Month {monthIndex + 1}</h4>
            <Input
              type="number"
              value={strategy.volume}
              onChange={(e) => handleMonthlyStrategyChange(monthIndex, 'volume', e.target.value)}
              placeholder="Volume"
            />
            <h5>Options</h5>
            {strategy.options.map((option, optionIndex) => (
              <OptionContainer key={optionIndex}>
                <Select
                  value={option.type}
                  onChange={(e) => handleOptionChange(monthIndex, optionIndex, 'type', e.target.value)}
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </Select>
                <Input
                  type="number"
                  value={option.strikePrice}
                  onChange={(e) => handleOptionChange(monthIndex, optionIndex, 'strikePrice', e.target.value)}
                  placeholder="Strike Price"
                />
                <Input
                  type="number"
                  value={option.expiration}
                  onChange={(e) => handleOptionChange(monthIndex, optionIndex, 'expiration', e.target.value)}
                  placeholder="Expiration (days)"
                />
                <Input
                  type="number"
                  value={option.impliedVolatility}
                  onChange={(e) => handleOptionChange(monthIndex, optionIndex, 'impliedVolatility', e.target.value)}
                  placeholder="Implied Volatility"
                  step="0.01"
                />
                <Input
                  type="number"
                  value={option.percentage}
                  onChange={(e) => handleOptionChange(monthIndex, optionIndex, 'percentage', e.target.value)}
                  placeholder="Percentage"
                  step="0.01"
                />
                <OptionPrice>
                  Price: {
                    optionPrices[`${monthIndex}-${optionIndex}`] !== undefined
                      ? (isNaN(optionPrices[`${monthIndex}-${optionIndex}`])
                          ? 'Invalid'
                          : `$${parseFloat(optionPrices[`${monthIndex}-${optionIndex}`]).toFixed(2)}`)
                      : 'Calculating...'
                  }
                </OptionPrice>
                <Button type="button" onClick={() => deleteOption(monthIndex, optionIndex)}>Delete</Button>
              </OptionContainer>
            ))}
            <Button type="button" onClick={() => addOption(monthIndex)}>Add Option</Button>
          </div>
        ))}
        <Button type="button" onClick={addMonthlyStrategy}>Add Month</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Running Simulation...' : 'Run Simulation'}
        </Button>
      </Form>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {results && (
        <ResultsContainer>
          <h3>Simulation Results</h3>
          <p>Total Hedged Cost: ${results.totalHedgedCost.toFixed(2)}</p>
          <p>Total Unhedged Cost: ${results.totalUnhedgedCost.toFixed(2)}</p>
          <p>Total Premium: ${results.totalPremium.toFixed(2)}</p>
          <p>P&L: ${results.pnl.toFixed(2)}</p>
          <p>Cost Reduction: {((results.pnl / results.totalUnhedgedCost) * 100).toFixed(2)}%</p>
        </ResultsContainer>
      )}
    </SimulationContainer>
  );
};

export default HedgingSimulation;