"use client"

import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

const RevenueChart = ({ data = null, isLoading = false }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current || isLoading) return;

    // Month labels
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Prepare chart data
    let chartData;
    
    if (data && data.monthlyRevenue) {
      // Use real API data
      chartData = {
        labels: monthLabels,
        datasets: [
          {
            label: "Revenue",
            data: data.monthlyRevenue.map(month => month.revenue || 0),
            backgroundColor: "rgba(147, 51, 234, 0.2)",
            borderColor: "#9333EA",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: "#9333EA",
            fill: true,
          },
          {
            label: "Service Fee",
            data: data.monthlyRevenue.map(month => month.serviceFee || 0),
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderColor: "#22c55e",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: "#22c55e",
            fill: false,
          },
        ],
      };
    } else {
      // Fallback to sample data
      chartData = {
        labels: monthLabels,
        datasets: [
          {
            label: "Revenue",
            data: [32500, 28600, 34200, 38700, 42100, 39800, 45200, 48600, 52300, 54800, 59200, 62400],
            backgroundColor: "rgba(147, 51, 234, 0.2)",
            borderColor: "#9333EA",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: "#9333EA",
            fill: true,
          },
        ],
      };
    }

    // Chart configuration
    const config = {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: data && data.monthlyRevenue ? true : false,
            labels: {
              color: "#9ca3af",
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: "#1e1e2d",
            titleColor: "#fff",
            bodyColor: "#9ca3af",
            borderColor: "#2d2d3a",
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(45, 45, 58, 0.5)",
              drawBorder: false,
            },
            ticks: {
              color: "#9ca3af",
            },
          },
          y: {
            grid: {
              color: "rgba(45, 45, 58, 0.5)",
              drawBorder: false,
            },
            ticks: {
              color: "#9ca3af",
              callback: (value) => "$" + value.toLocaleString(),
            },
            beginAtZero: true,
          },
        },
      },
    }

    // Create chart
    if (chartRef.current) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // Create new chart
      chartInstance.current = new Chart(chartRef.current, config)
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, isLoading]) // Add dependencies to re-render when data changes

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-400 text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}

export default RevenueChart
