import React, { useState, useEffect } from 'react';
import DynamicChart from './DynamicChart';
import styled from 'styled-components';
import Papa from 'papaparse';

// Custom Holt-Winters implementation
const holtWinters = (data, alpha = 0.3, beta = 0.1, gamma = 0.1, season_length = 6, num_forecasts = 6) => {
  const seasons = Math.floor(data.length / season_length);
  
  // Initialize seasonal components
  let seasonals = Array(season_length).fill(0);
  for (let i = 0; i < season_length; i++) {
    let sum = 0;
    for (let j = 0; j < seasons; j++) {
      sum += data[i + j * season_length] || 0;
    }
    seasonals[i] = sum / seasons;
  }

  let level = data[0];
  let trend = (data[data.length-1] - data[0]) / data.length;
  
  let forecast = [];
  
  for (let i = 0; i < data.length + num_forecasts; i++) {
    if (i < data.length) {
      let value = data[i];
      let last_level = level;
      let season = seasonals[i % season_length];
      
      level = alpha * (value - season) + (1 - alpha) * (last_level + trend);
      trend = beta * (level - last_level) + (1 - beta) * trend;
      seasonals[i % season_length] = gamma * (value - level) + (1 - gamma) * season;
    }
    
    let prediction = level + trend + seasonals[i % season_length];
    if (i >= data.length) {
      forecast.push(Math.round(prediction));
    }
  }
  
  return forecast;
};

// Styled components
const DashboardContainer = styled.div`
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
`;

const Section = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #444;
  margin-bottom: 15px;
`;

const Input = styled.input`
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const Th = styled.th`
  background-color: #f8f9fa;
  padding: 12px;
  border: 1px solid #dee2e6;
  text-align: left;
`;

const Td = styled.td`
  padding: 12px;
  border: 1px solid #dee2e6;
`;

const CheckboxLabel = styled.label`
  margin-right: 15px;
  display: inline-flex;
  align-items: center;
`;

const Checkbox = styled.input`
  margin-right: 5px;
`;

const FileInput = styled.input`
  margin-bottom: 10px;
`;

const Dashboard = () => {
  const [data, setData] = useState({
    timeperiods: [],
    products: [],
    consumption: [],
    prices: [],
    currencies: [],
    exchangeRates: []
  });

  const [visibleProducts, setVisibleProducts] = useState({});
  const [predictions, setPredictions] = useState({
    timeperiods: [],
    consumption: []
  });
  const [showPredictions, setShowPredictions] = useState(false);

  const [newProduct, setNewProduct] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [localCurrency, setLocalCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expositionData, setExpositionData] = useState([]);
  const [totalExposition, setTotalExposition] = useState([]);

  const [currentStock, setCurrentStock] = useState({});
  const [stockValuation, setStockValuation] = useState({});
  const [showCurrentStock, setShowCurrentStock] = useState(false);
  const [stockMode, setStockMode] = useState('total'); // 'total' or 'monthly'
  const [monthlyStock, setMonthlyStock] = useState({});
  useEffect(() => {
    predictFutureConsumption();
    calculateExposition();
  }, [data]);

  const addProduct = () => {
    if (newProduct && !data.products.includes(newProduct)) {
      const nextMonth = getNextMonth();
      setData(prevData => ({
        ...prevData,
        products: [...prevData.products, newProduct],
        consumption: [...prevData.consumption, [0]], // Start with one future month
        prices: [...(prevData.prices || []), newProductPrice ? parseFloat(newProductPrice) : null],
        currencies: [...(prevData.currencies || []), localCurrency],
        exchangeRates: [...(prevData.exchangeRates || []), parseFloat(exchangeRate)],
        timeperiods: prevData.timeperiods.length === 0 ? [nextMonth] : [...prevData.timeperiods]
      }));
      setVisibleProducts(prev => ({ ...prev, [newProduct]: true }));
      setCurrentStock(prev => ({ ...prev, [newProduct]: 0 }));
      setStockValuation(prev => ({ ...prev, [newProduct]: 0 }));
      setNewProduct('');
      setNewProductPrice('');
      setLocalCurrency('USD');
      setExchangeRate(1);
    }
  };

  const getNextMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().slice(0, 7); // YYYY-MM format
  };

  const addTimePeriodRange = () => {
    const nextMonth = getNextMonth();
    if (startDate && endDate && new Date(startDate) >= new Date(nextMonth)) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const newPeriods = [];

      while (start <= end) {
        const periodString = start.toISOString().slice(0, 7); // YYYY-MM format
        if (!data.timeperiods.includes(periodString)) {
          newPeriods.push(periodString);
        }
        start.setMonth(start.getMonth() + 1);
      }

      if (newPeriods.length > 0) {
        setData(prevData => ({
          ...prevData,
          timeperiods: [...prevData.timeperiods, ...newPeriods].sort(),
          consumption: prevData.consumption?.map(product => [
            ...product,
            ...Array(newPeriods.length).fill(0)
          ])
        }));
      }

      setStartDate('');
      setEndDate('');
    }
  };

  const handleDataChange = (productIndex, periodIndex, newValue) => {
    const newData = { ...data };
    newData.consumption[productIndex][periodIndex] = Number(newValue);
    setData(newData);
  };

  const toggleProductVisibility = (product) => {
    setVisibleProducts(prev => ({
      ...prev,
      [product]: !prev[product]
    }));
  };

  const predictFutureConsumption = () => {
    if (data.timeperiods.length === 0) return;

    const lastDate = new Date(data.timeperiods[data.timeperiods.length - 1]);
    const futurePredictions = {
      timeperiods: Array.from({ length: 6 }, (_, i) => {
        const nextDate = new Date(lastDate);
        nextDate.setMonth(lastDate.getMonth() + i + 1);
        return nextDate.toISOString().slice(0, 7); // YYYY-MM format
      }),
      consumption: []
    };

    data.consumption.forEach((productData) => {
      const futureValues = holtWinters(productData);
      futurePredictions.consumption.push(futureValues);
    });

    setPredictions(futurePredictions);
  };

  const calculateExposition = () => {
    const newExpositionData = data.consumption?.map((productConsumption, index) => {
      const price = data.prices[index];
      const rate = data.exchangeRates[index];
      return productConsumption?.map(consumption => 
        price !== null ? consumption * price * rate : null
      );
    });
  
    const newTotalExposition = data.timeperiods?.map((_, periodIndex) => {
      return newExpositionData.reduce((total, product) => {
        const value = product[periodIndex];
        return value !== null ? total + value : total;
      }, 0);
    });
  
    // Calculate cumulative total exposition
    const cumulativeTotalExposition = newTotalExposition.reduce((acc, value, index) => {
      acc[index] = (acc[index - 1] || 0) + value;
      return acc;
    }, []);
  
    setExpositionData(newExpositionData);
    setTotalExposition(cumulativeTotalExposition);
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      complete: (results) => {
        const csvData = results.data;
        processCSVData(csvData);
      },
      header: true
    });
  };

  const processCSVData = (csvData) => {
    // Implement CSV data processing logic here
    // This is a basic implementation. You might need to adjust it based on your CSV structure
    const newData = { ...data };
    const newTimeperiods = new Set(data.timeperiods);
    
    csvData.forEach(row => {
      const product = row.product;
      const timeperiod = row.timeperiod;
      const consumption = Number(row.consumption);

      if (!newData.products.includes(product)) {
        newData.products.push(product);
        newData.consumption.push([]);
        setVisibleProducts(prev => ({ ...prev, [product]: true }));
      }

      if (!newTimeperiods.has(timeperiod)) {
        newTimeperiods.add(timeperiod);
      }

      const productIndex = newData.products.indexOf(product);
      const periodIndex = Array.from(newTimeperiods).indexOf(timeperiod);

      if (!newData.consumption[productIndex]) {
        newData.consumption[productIndex] = [];
      }

      newData.consumption[productIndex][periodIndex] = consumption;
    });

    newData.timeperiods = Array.from(newTimeperiods).sort();

    // Ensure all products have consumption data for all timeperiods
    newData.consumption = newData.consumption?.map(productConsumption => {
      const filledConsumption = new Array(newData.timeperiods.length).fill(0);
      productConsumption.forEach((value, index) => {
        if (value !== undefined) {
          filledConsumption[index] = value;
        }
      });
      return filledConsumption;
    });

    setData(newData);
  };

  const updateCurrentStock = (product, value) => {
    setCurrentStock(prev => ({
      ...prev,
      [product]: Number(value)
    }));
  };
  
  const updateMonthlyStock = (product, period, value) => {
    setMonthlyStock(prev => ({
      ...prev,
      [product]: {
        ...(prev[product] || {}),
        [period]: Number(value)
      }
    }));
  };
  
  const calculateStockValuation = (product) => {
    const productIndex = data.products.indexOf(product);
    const price = data.prices[productIndex];
    const rate = data.exchangeRates[productIndex];
  
    if (stockMode === 'monthly') {
      return Object.values(monthlyStock[product] || {}).reduce((total, stock) => {
        return total + (stock * price * rate);
      }, 0);
    } else {
      return (currentStock[product] || 0) * price * rate;
    }
  };


  return (
    <DashboardContainer>
      <Title>Product Consumption Dashboard</Title>
      
      <Section>
        <SectionTitle>Add New Product</SectionTitle>
        <Input 
          type="text" 
          value={newProduct} 
          onChange={(e) => setNewProduct(e.target.value)}
          placeholder="New Product Name"
        />
        <Input 
          type="number" 
          value={newProductPrice} 
          onChange={(e) => setNewProductPrice(e.target.value)}
          placeholder="Price in USD (optional)"
        />
        <Input 
          type="text" 
          value={localCurrency} 
          onChange={(e) => setLocalCurrency(e.target.value)}
          placeholder="Local Currency"
        />
        <Input 
          type="number" 
          value={exchangeRate} 
          onChange={(e) => setExchangeRate(e.target.value)}
          placeholder="Exchange Rate (1 USD to Local Currency)"
        />
        <Button onClick={addProduct}>Add Product</Button>
      </Section>
  
      <Section>
        <SectionTitle>Add Time Period Range</SectionTitle>
        <Input 
          type="month" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <Input 
          type="month" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <Button onClick={addTimePeriodRange}>Add Time Periods</Button>
      </Section>
  
      <Section>
        <SectionTitle>Import Historical Data</SectionTitle>
        <FileInput type="file" accept=".csv" onChange={handleCSVUpload} />
      </Section>
  
      <Section>
        {data.products.map(product => (
          <CheckboxLabel key={product}>
            <Checkbox
              type="checkbox"
              checked={visibleProducts[product]}
              onChange={() => toggleProductVisibility(product)}
            />
            {product}
          </CheckboxLabel>
        ))}
        <CheckboxLabel>
          <Checkbox
            type="checkbox"
            checked={showPredictions}
            onChange={() => setShowPredictions(!showPredictions)}
          />
          Show Predictions
        </CheckboxLabel>
      </Section>
  
      <Section>
        <SectionTitle>Current Stock Management</SectionTitle>
        <CheckboxLabel>
          <Checkbox
            type="checkbox"
            checked={showCurrentStock}
            onChange={() => setShowCurrentStock(!showCurrentStock)}
          />
          Show Current Stock
        </CheckboxLabel>
        {showCurrentStock && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <CheckboxLabel>
                <Checkbox
                  type="radio"
                  checked={stockMode === 'total'}
                  onChange={() => setStockMode('total')}
                />
                Total Stock
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox
                  type="radio"
                  checked={stockMode === 'monthly'}
                  onChange={() => setStockMode('monthly')}
                />
                Monthly Stock
              </CheckboxLabel>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  {stockMode === 'monthly' ? (
                    data.timeperiods.map(period => <Th key={period}>{period}</Th>)
                  ) : (
                    <Th>Current Stock</Th>
                  )}
                  <Th>Stock Valuation</Th>
                </tr>
              </thead>
              <tbody>
                {data.products?.map(product => (
                  <tr key={`stock-${product}`}>
                    <Td>{product}</Td>
                    {stockMode === 'monthly' ? (
                      data.timeperiods.map(period => (
                        <Td key={`${product}-${period}`}>
                          <Input
                            type="number"
                            value={monthlyStock[product]?.[period] || 0}
                            onChange={(e) => updateMonthlyStock(product, period, e.target.value)}
                          />
                        </Td>
                      ))
                    ) : (
                      <Td>
                        <Input
                          type="number"
                          value={currentStock[product] || 0}
                          onChange={(e) => updateCurrentStock(product, e.target.value)}
                        />
                      </Td>
                    )}
                    <Td>
                      {calculateStockValuation(product).toFixed(2)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Section>
  
      <Section>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                {data.timeperiods?.map(period => (
                  <Th key={period}>{period}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products?.map((product, productIndex) => (
                <tr key={product}>
                  <Td>{product}</Td>
                  {data.consumption[productIndex]?.map((value, periodIndex) => (
                    <Td key={`${product}-${data.timeperiods[periodIndex]}`}>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleDataChange(productIndex, periodIndex, e.target.value)}
                        style={{ width: '60px' }}
                      />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Section>
  
      <Section>
      <DynamicChart 
          data={data} 
          visibleProducts={visibleProducts} 
          predictions={showPredictions ? predictions : { timeperiods: [], consumption: [] }} 
          expositionData={expositionData}
          totalExposition={totalExposition}
          currentStock={showCurrentStock ? (stockMode === 'monthly' ? monthlyStock : currentStock) : null}
          stockValuation={showCurrentStock ? calculateStockValuation : null}
          stockMode={stockMode}
        />
      </Section>
    </DashboardContainer>
  );
};

export default Dashboard;