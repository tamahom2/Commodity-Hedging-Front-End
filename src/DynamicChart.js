import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

const ChartContainer = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const TotalExposition = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-top: 20px;
  text-align: center;
`;

const DynamicChart = ({ 
  data, 
  visibleProducts, 
  predictions, 
  expositionData, 
  totalExposition, 
  currentStock, 
  stockValuation,
  stockMode 
}) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        onClick: null
      },
      title: {
        display: true,
        font: {
          size: 18,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  const allTimePeriods = [...data.timeperiods, ...predictions.timeperiods];

  const consumptionChartData = {
    labels: allTimePeriods,
    datasets: data.products.map((product, index) => ({
      label: product,
      data: [
        ...data.consumption[index], 
        ...(predictions.consumption[index] || [])
      ],
      backgroundColor: `hsla(${index * 137.508}, 70%, 60%, 0.7)`,
      borderColor: `hsla(${index * 137.508}, 70%, 50%, 1)`,
      borderWidth: 1,
      hidden: !visibleProducts[product],
    })),
  };

  const expositionChartData = {
    labels: data.timeperiods,
    datasets: [
      ...data.products.map((product, index) => ({
        label: `${product} (${data.currencies[index]})`,
        data: expositionData[index],
        borderColor: `hsla(${index * 137.508}, 70%, 50%, 1)`,
        backgroundColor: `hsla(${index * 137.508}, 70%, 60%, 0.1)`,
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        hidden: !visibleProducts[product],
      })),
      {
        label: 'Total Exposition',
        data: totalExposition,
        borderColor: 'rgba(0, 0, 0, 1)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
      }
    ],
  };

  let stockChartData = null;
  if (currentStock) {
    const stockData = stockMode === 'monthly'
      ? data.timeperiods.map(period =>
          data.products.reduce((total, product) =>
            total + (currentStock[product]?.[period] || 0), 0))
      : [data.products.reduce((total, product) =>
          total + (currentStock[product] || 0), 0)];

    stockChartData = {
      labels: stockMode === 'monthly' ? data.timeperiods : ['Total Stock'],
      datasets: [{
        label: 'Current Stock',
        data: stockData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  }

  return (
    <>
      <ChartContainer>
        <Bar 
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              title: {
                ...options.plugins.title,
                text: 'Product Consumption' + (predictions.timeperiods.length > 0 ? ' (including predictions)' : ''),
              },
            },
          }} 
          data={consumptionChartData} 
        />
      </ChartContainer>
      <ChartContainer>
        <Line 
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              title: {
                ...options.plugins.title,
                text: 'Product Exposition (Local Currencies)',
              },
            },
          }} 
          data={expositionChartData} 
        />
        <TotalExposition>
          Total Exposition: {totalExposition[totalExposition.length - 1]?.toFixed(2) || 'N/A'}
        </TotalExposition>
      </ChartContainer>
      {stockChartData && (
        <ChartContainer>
          <Bar
            options={{
              ...options,
              plugins: {
                ...options.plugins,
                title: {
                  ...options.plugins.title,
                  text: `Current Stock (${stockMode === 'monthly' ? 'Monthly' : 'Total'})`,
                },
              },
            }}
            data={stockChartData}
          />
        </ChartContainer>
      )}
    </>
  );
};

export default DynamicChart;