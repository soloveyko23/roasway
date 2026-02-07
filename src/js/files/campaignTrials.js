import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

/**********************************************
 * Класс CampaignTrialsChart
 * Виджет «Триалы по кампаниям»:
 *   — Doughnut-чарт (таблица статическая в HTML)
 **********************************************/
class CampaignTrialsChart {
  constructor(containerId, config) {
    this.containerId = containerId;
    this.config = config;

    this.container = document.querySelector(`[data-campaign-trials="${containerId}"]`);
    if (!this.container) {
      console.error(`CampaignTrialsChart: container [data-campaign-trials="${containerId}"] not found.`);
      return;
    }

    this.chart = null;
    this.tooltipEl = null;

    this._createChart();
  }

  /**
   * Doughnut чарт с текстом в центре
   */
  _createChart() {
    const chartWrap = this.container.querySelector('[data-trials-chart]');
    if (!chartWrap) return;

    const canvas = document.createElement('canvas');
    chartWrap.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const campaigns = this.config.campaigns;
    const total = campaigns.reduce((sum, c) => sum + c.trials, 0);

    const centerTextPlugin = {
      id: `centerText_${this.containerId}`,
      afterDraw: (chart) => {
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;

        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.font = 'bold 28px Inter';
        c.fillStyle = '#121926';
        c.fillText(total, cx, cy - 10);

        c.font = '13px Inter';
        c.fillStyle = '#9AA4B2';
        c.fillText('Триалов', cx, cy + 14);
        c.restore();
      }
    };

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: campaigns.map(c => c.name),
        datasets: [{
          data: campaigns.map(c => c.trials),
          backgroundColor: campaigns.map(c => c.color),
          borderWidth: 0,
          hoverBorderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        layout: { padding: 6 },
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            enabled: false,
            external: (context) => this._renderTooltip(context),
          },
        },
        animation: { duration: 800, easing: 'easeOutCubic' },
      },
      plugins: [centerTextPlugin],
    });
  }

  /**
   * Кастомный тултип
   */
  _renderTooltip(context) {
    const { tooltip } = context;
    const chartWrap = this.container.querySelector('[data-trials-chart]');

    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'absolute z-50 bg-white rounded-lg shadow-md pointer-events-none opacity-0 transition-opacity duration-150 min-w-40';
      chartWrap.appendChild(this.tooltipEl);
    }

    if (tooltip.opacity === 0) {
      this.tooltipEl.style.opacity = '0';
      return;
    }

    const dataPoint = tooltip.dataPoints?.[0];
    if (!dataPoint) return;

    const idx = dataPoint.dataIndex;
    const campaign = this.config.campaigns[idx];
    if (!campaign) return;

    this.tooltipEl.innerHTML = `
      <div class="bg-Gray-100 px-3 py-2 rounded-t-lg text-xs font-medium text-Gray-700">${campaign.name}</div>
      <div class="flex items-center gap-2 px-3 py-2">
        <span class="w-2 h-2 min-w-2 rounded-full" style="background-color: ${campaign.color};"></span>
        <span class="text-sm font-semibold text-Gray-900">${campaign.trials} триалов</span>
        <span class="text-sm text-Gray-600 ml-auto">${campaign.price}</span>
      </div>
    `;

    this.tooltipEl.style.opacity = '1';

    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const chartRect = chartWrap.getBoundingClientRect();

    let left = tooltip.caretX - tooltipRect.width / 2;
    let top = tooltip.caretY - tooltipRect.height - 12;

    left = Math.max(4, Math.min(left, chartRect.width - tooltipRect.width - 4));
    if (top < 4) top = tooltip.caretY + 12;

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  destroy() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (this.tooltipEl) { this.tooltipEl.remove(); this.tooltipEl = null; }
  }
}

export default CampaignTrialsChart;
