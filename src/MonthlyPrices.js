import React, { useState } from 'react';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

const PageContainer = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FileInput = styled.input`
  margin-bottom: 20px;
`;

const Select = styled.select`
  margin-bottom: 20px;
  padding: 5px;
`;

const ChartContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const MonthlyPrices = () => {
    const [priceData, setPriceData] = useState({});
    const [selectedProduct, setSelectedProduct] = useState('');
    const [products, setProducts] = useState([]);
  
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = 'Monthly Prices';
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processData(data);
      };
      reader.readAsBinaryString(file);
    };
  
    const processData = (data) => {
      const headers = data[4]; // Assuming the 5th row contains the headers
      const processedData = {};
      const productList = headers.filter(header => header && header !== 'Date');
  
      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        const date = row[0];
        if (date && typeof date === 'string' && date.length === 7) { // Ensure valid date string
          const formattedDate = formatDate(date);
          for (let j = 1; j < headers.length; j++) {
            const product = headers[j];
            if (product && product !== 'Date') {
              if (!processedData[product]) {
                processedData[product] = [];
              }
              if (row[j] !== '...') { // Skip empty cells
                processedData[product].push({ date: formattedDate, price: row[j] });
              }
            }
          }
        } else {
          console.warn(`Invalid date found: ${date}`);
        }
      }
  
      setPriceData(processedData);
      setProducts(productList);
      setSelectedProduct(productList[0]);
    };
  
    const formatDate = (dateString) => {
      const year = dateString.slice(0, 4);
      const month = dateString.slice(5, 7);
      return `${year}-${month}`;
    };
  
    const chartData = {
      labels: priceData[selectedProduct]?.map(item => item.date) || [],
      datasets: [
        {
          label: selectedProduct,
          data: priceData[selectedProduct]?.map(item => item.price) || [],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'World Bank Commodity Price Data'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (US dollars)'
          }
        }
      }
    };
  
    return (
      <PageContainer>
        <Title>World Bank Commodity Price Data (The Pink Sheet)</Title>
        <FileInput type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        {products.length > 0 && (
          <Select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
            {products.map(product => (
              <option key={product} value={product}>{product}</option>
            ))}
          </Select>
        )}
        <ChartContainer>
          <Line data={chartData} options={chartOptions} />
        </ChartContainer>
      </PageContainer>
    );
  };
  
  export default MonthlyPrices;
