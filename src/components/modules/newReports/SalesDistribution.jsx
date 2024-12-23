import { useMemo, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { Button, Loader } from '@mantine/core';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import ChartDataLabels from 'chartjs-plugin-datalabels';
dayjs.extend(quarterOfYear);
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  LogarithmicScale,
  Chart,
} from 'chart.js';
import {
  usebookingsSalesDistribution,
} from '../../../apis/queries/booking.queries';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';
import { serialize } from '../../../utils';
import classNames from 'classnames';
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  LogarithmicScale,
);
const monthsInShort = [
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
];
const SalesDistribution = () => {
  const chartRef = useRef(null); // Reference to the chart instance

  const { data: bookingData, isLoading: isLoadingBookingData } = usebookingsSalesDistribution();

  const salesData = useMemo(() => {
    if (!bookingData || bookingData.length === 0) {
      return monthsInShort.map(() => ({
        government: 0,
        nationalAgency: 0,
        localAgency: 0,
        directClient: 0,
        total: 0,
      }));
    }

    const clientTypeMapping = {
      government: 'government',
      'directclient': 'directClient',
      'direct client': 'directClient',
      'nationalagency': 'nationalAgency',
      'national agency': 'nationalAgency',
      'localagency': 'localAgency',
      'local agency': 'localAgency',
    };

    const aggregatedSales = monthsInShort.reduce((acc, month) => {
      acc[month] = { government: 0, nationalAgency: 0, localAgency: 0, directClient: 0, total: 0 };
      return acc;
    }, {});

    bookingData.forEach(({ createdAt, totalAmount, client }) => {
      const monthKey = new Date(createdAt).toLocaleString('default', { month: 'short' });
      const clientType =
        clientTypeMapping[client?.clientType?.toLowerCase()?.replace(/\s/g, '')] || 'unknown';

      if (aggregatedSales[monthKey] && clientType !== 'unknown') {
        const amountInLacs = totalAmount / 100000; // Convert to lakhs
        aggregatedSales[monthKey][clientType] += amountInLacs;
        aggregatedSales[monthKey].total += amountInLacs;
      }
    });

    return monthsInShort.map(month => aggregatedSales[month]);
  }, [bookingData]);

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Sales (lac)',
          },
          ticks: {
            callback: value => `${value.toFixed(2)} L`,
          },
          beginAtZero: true,
          position: 'left',
        },
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'end',
          formatter: (value, context) => {
            if (value === 0) {
              return '';
            }
            return value >= 1 ? Math.floor(value) : value.toFixed(2);
          },
          color: '#000',
          font: {
            weight: 'light',
            size: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: context => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += `${context.parsed.y.toFixed(2)} L`;
              }
              return label;
            },
          },
        },
      },
    }),
    [],
  );
  const barData = useMemo(
    () => ({
      labels: monthsInShort,
      datasets: [
        { label: 'Government', data: salesData.map(d => d.government), backgroundColor: '#FF6384' },
        {
          label: 'National Agency',
          data: salesData.map(d => d.nationalAgency),
          backgroundColor: '#36A2EB',
        },
        {
          label: 'Local Agency',
          data: salesData.map(d => d.localAgency),
          backgroundColor: '#FFCE56',
        },
        {
          label: 'Direct Client',
          data: salesData.map(d => d.directClient),
          backgroundColor: '#4BC0C0',
        },
      ],
    }),
    [salesData],
  );
  const stackedBarOptions = useMemo(
    () => ({
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month',
          },
          stacked: true,
        },
        y: {
          title: {
            display: true,
            text: 'Percentage Contribution (%)',
          },
          stacked: true,
          beginAtZero: true,
          max: 100, // Limit Y-axis to 100%
          ticks: {
            callback: value => `${value}%`,
          },
        },
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: 'center',
          align: 'center',
          formatter: value => {
            const parsedValue = parseFloat(value);
            if (parsedValue > 0) {
              return `${parsedValue.toFixed(0)}%`;
            } else {
              return '';
            }
          },
          color: '#000',
          font: {
            size: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: context => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.raw !== null) {
                label += `${context.raw}%`;
              }
              return label;
            },
          },
        },
      },
    }),
    [],
  );

  const percentageBarData = useMemo(
    () => ({
      labels: monthsInShort,
      datasets: [
        {
          label: 'Government',
          data: salesData.map((item, idx) =>
            item.total ? ((item.government / item.total) * 100).toFixed(2) : 0,
          ),
          backgroundColor: '#FF6384',
        },
        {
          label: 'National Agency',
          data: salesData.map((item, idx) =>
            item.total ? ((item.nationalAgency / item.total) * 100).toFixed(2) : 0,
          ),
          backgroundColor: '#36A2EB',
        },
        {
          label: 'Local Agency',
          data: salesData.map((item, idx) =>
            item.total ? ((item.localAgency / item.total) * 100).toFixed(2) : 0,
          ),
          backgroundColor: '#FFCE56',
        },
        {
          label: 'Direct Client',
          data: salesData.map((item, idx) =>
            item.total ? ((item.directClient / item.total) * 100).toFixed(2) : 0,
          ),
          backgroundColor: '#4BC0C0',
        },
      ],
    }),
    [salesData],
  );

  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';
  //For Pdf Download
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf1 = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Sales_distribution');

    html2pdf()
      .set({ filename: 'Sales_disReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  const handleDownloadPdf2 = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Percentage_contribution');

    html2pdf()
      .set({ filename: 'Percentage_contriReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className="flex flex-col pt-4">
      <div
        id="Sales_distribution"
        className={classNames('p-6', isReport ? 'w-[37rem]' : 'w-[47rem]')}
      >
        <div className="flex justify-between items-center">
          <p className="font-bold">Monthly Sales Distribution</p>
          {isReport ? null : (
            <div className=" ">
              <Button
                className="primary-button mx-3 pdf_download_button"
                onClick={handleDownloadPdf1}
                loading={isDownloadPdfLoading}
                disabled={isDownloadPdfLoading}
              >
                <Download size="20" color="white" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 italic pt-3">
          This bar chart shows the monthly revenue distribution between different clients types.
        </p>
        {isLoadingBookingData ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : (
          <div className="my-4">
            <Bar
              ref={chartRef}
              data={barData}
              options={barChartOptions}
              plugins={[ChartDataLabels]}
            />
          </div>
        )}
      </div>
      <div
        className={classNames('px-6 pb-6', isReport ? 'w-[37rem]' : 'w-[47rem]')}
        id="Percentage_contribution"
      >
        <div className="flex justify-between items-center">
          <p className="font-bold">Monthly Percentage Contribution</p>
          {isReport ? null : (
            <div className=" ">
              <Button
                className="primary-button mx-3 pdf_download_button"
                onClick={handleDownloadPdf2}
                loading={isDownloadPdfLoading}
                disabled={isDownloadPdfLoading}
              >
                <Download size="20" color="white" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 italic pt-3">
          This chart visualizes the percentage contribution of different client types.
        </p>
        {isLoadingBookingData ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : (
          <div className="my-4">
            <Bar
              ref={chartRef}
              data={percentageBarData}
              options={stackedBarOptions}
              plugins={[ChartDataLabels]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDistribution;
