/**
 * dashboard.js — Chart.js powered analytics dashboard helpers
 */

const Dashboard = (() => {
  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'hsl(220,20%,70%)',
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
          padding: 16,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10,12,20,0.95)',
        titleColor: '#00e5ff',
        bodyColor: 'hsl(220,20%,75%)',
        borderColor: 'rgba(0,229,255,0.2)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid:  { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'hsl(220,15%,50%)', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid:  { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'hsl(220,15%,50%)', font: { family: 'JetBrains Mono', size: 10 } },
      }
    }
  };

  let _charts = {};

  function _destroy(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
  }

  /** Render a grayscale + RGB channel histogram */
  function renderHistogram(canvasId, chartData) {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = chartData.labels;
    const datasets = [];

    if (chartData.before !== undefined) {
      // Equalization comparison
      datasets.push({
        label: 'Before Equalization',
        data: chartData.before,
        borderColor: 'rgba(100,130,255,0.8)',
        backgroundColor: 'rgba(100,130,255,0.08)',
        borderWidth: 1,
        pointRadius: 0,
        fill: true,
      });
      datasets.push({
        label: 'After Equalization',
        data: chartData.after,
        borderColor: 'rgba(0,229,255,0.8)',
        backgroundColor: 'rgba(0,229,255,0.08)',
        borderWidth: 1,
        pointRadius: 0,
        fill: true,
      });
    } else if (chartData.gray) {
      datasets.push({
        label: 'Grayscale Intensity',
        data: chartData.gray,
        borderColor: 'rgba(0,229,255,0.7)',
        backgroundColor: 'rgba(0,229,255,0.06)',
        borderWidth: 1,
        pointRadius: 0,
        fill: true,
      });
      if (chartData.channels) {
        const colors = [
          ['rgba(80,120,255,0.6)', 'rgba(80,120,255,0.05)'],
          ['rgba(60,220,100,0.6)', 'rgba(60,220,100,0.05)'],
          ['rgba(255,80,80,0.6)', 'rgba(255,80,80,0.05)'],
        ];
        ['blue','green','red'].forEach((ch, i) => {
          datasets.push({
            label: ch.charAt(0).toUpperCase() + ch.slice(1),
            data: chartData.channels[ch],
            borderColor: colors[i][0],
            backgroundColor: colors[i][1],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          });
        });
      }
    }

    _charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { ...CHART_DEFAULTS.plugins.legend }
        },
        animation: { duration: 600 },
        scales: {
          x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'Intensity (0–255)', color: 'hsl(220,15%,45%)', font: { size: 10 } } },
          y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Pixel Count', color: 'hsl(220,15%,45%)', font: { size: 10 } } },
        }
      }
    });
  }

  /** Render a donut chart for detection categories */
  function renderDetectionDonut(canvasId, byCategory) {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const entries = Object.entries(byCategory);
    if (!entries.length) return;

    const palette = [
      '#00e5ff','#9b59b6','#2ecc71','#f39c12','#e74c3c',
      '#1abc9c','#3498db','#e91e63','#ff9800','#9c27b0',
    ];

    _charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          data: entries.map(e => e[1]),
          backgroundColor: entries.map((_, i) => palette[i % palette.length] + '99'),
          borderColor: entries.map((_, i) => palette[i % palette.length]),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: CHART_DEFAULTS.plugins.legend,
          tooltip: CHART_DEFAULTS.plugins.tooltip,
        },
        animation: { animateRotate: true, duration: 700 },
        cutout: '62%',
      }
    });
  }

  /** Render a polar chart for motion direction histogram */
  function renderDirectionPolar(canvasId, directionData) {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const { labels, data } = directionData;

    _charts[canvasId] = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(0,229,255,0.45)','rgba(0,180,255,0.45)','rgba(155,89,182,0.45)',
            'rgba(200,80,200,0.45)','rgba(255,80,120,0.45)','rgba(255,160,0,0.45)',
            'rgba(80,200,80,0.45)','rgba(0,220,160,0.45)',
          ],
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: CHART_DEFAULTS.plugins.legend,
          tooltip: CHART_DEFAULTS.plugins.tooltip,
        },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: 'hsl(220,15%,50%)', backdropColor: 'transparent', font: { size: 9 } },
            pointLabels: { color: 'hsl(220,20%,70%)', font: { size: 10, family: 'Inter' } },
          }
        },
        animation: { duration: 700 },
      }
    });
  }

  /** Render a line chart for motion magnitude over frames */
  function renderMagnitudeLine(canvasId, magnitudes) {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || !magnitudes.length) return;

    _charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: magnitudes.map((_, i) => i + 1),
        datasets: [{
          label: 'Motion Magnitude',
          data: magnitudes,
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0,229,255,0.06)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.4,
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
        scales: {
          x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'Frame Sample', color: 'hsl(220,15%,45%)', font: { size: 10 } } },
          y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Magnitude', color: 'hsl(220,15%,45%)', font: { size: 10 } } },
        }
      }
    });
  }

  /** Render a bar chart for category counts */
  function renderCategoryBar(canvasId, byCategory) {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const entries = Object.entries(byCategory);
    if (!entries.length) return;

    _charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          label: 'Unique Tracked Objects',
          data: entries.map(e => e[1]),
          backgroundColor: 'rgba(0,229,255,0.2)',
          borderColor: '#00e5ff',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
        scales: {
          x: { ...CHART_DEFAULTS.scales.x },
          y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true, ticks: { ...CHART_DEFAULTS.scales.y.ticks, stepSize: 1 } },
        },
        animation: { duration: 600 }
      }
    });
  }

  return { renderHistogram, renderDetectionDonut, renderDirectionPolar, renderMagnitudeLine, renderCategoryBar };
})();
