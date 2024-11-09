import { useMemo, useRef, useState, useEffect } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
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
} from 'chart.js';
import { useBookingsNew } from '../../../apis/queries/booking.queries';
import classNames from 'classnames';
import html2pdf from 'html2pdf.js';
import { Download } from 'react-feather';
import { serialize } from '../../../utils';
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
const customLinesPlugin = {
  id: 'customLines',
  afterDraw(chart) {
    const ctx = chart.ctx;
    if (!ctx) return;

    const dataset = chart.getDatasetMeta(0).data;

    dataset.forEach((arc, index) => {
      const { startAngle, endAngle, outerRadius, x, y } = arc.getProps(
        ['startAngle', 'endAngle', 'outerRadius', 'x', 'y'],
        true,
      );

      const angle = (startAngle + endAngle) / 2;
      const xEdge = Math.cos(angle) * outerRadius;
      const yEdge = Math.sin(angle) * outerRadius;

      const xLine = xEdge + Math.cos(angle) * 10;
      const yLine = yEdge + Math.sin(angle) * 10;

      const xEnd = x + xLine;
      const yEnd = y + yLine;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + xEdge, y + yEdge);
      ctx.lineTo(xEnd, yEnd);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  },
};
const barDataConfigByClient = {
  styles: {
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    radius: '90%', 
    plugins: {
      legend: {
        display: true,
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 20,
          padding: 20,
        },
      },
      datalabels: {
        formatter: value => {
          return value >= 1 ? Math.floor(value) : value.toFixed(1);
        },
        color: '#000',
        anchor: 'end',
        align: 'end',
        // offset: 2,
      },
    },
  },
};
const clientTypeLabels = {
  government: 'Government',
  nationalagency: 'National Agency',
  localagency: 'Local Agency',
  directclient: 'Direct Client',
};
const SourceClientDistribution = () => {
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  const chartRef = useRef(null);

  const { data: bookingData, isLoading: isLoadingBookingData } = useBookingsNew(
    serialize({ page: 1,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'desc'})
  );

  // Calculate Own and Traded Site Revenues
  const calculateSiteRevenues = bookingData => {
    let ownSiteRevenue = 0;
    let tradedSiteRevenue = 0;

    bookingData?.forEach(booking => {
      booking.details.forEach(detail => {
        detail.campaign.spaces.forEach(space => {
          if (space.tradedAmount === 0) {
            ownSiteRevenue += space.totalPrice || 0;
          } else {
            tradedSiteRevenue += space.totalPrice || 0;
          }
        });
      });
    });
    return {
      ownSiteRevenue: (ownSiteRevenue / 100000).toFixed(2), // Convert to lac and format to 2 decimal places
      tradedSiteRevenue: (tradedSiteRevenue / 100000).toFixed(2), // Convert to lac and format to 2 decimal places
    };
  };

  const { ownSiteRevenue, tradedSiteRevenue } = useMemo(
    () => calculateSiteRevenues(bookingData),
    [bookingData],
  );

  const printSitesData = useMemo(
    () => ({
      labels: ['Own Sites', 'Traded Sites'], // Chart labels for the legend
      datasets: [
        {
          data: [ownSiteRevenue, tradedSiteRevenue],
          backgroundColor: ['#FF900E', '#914EFB'], // Own Sites = Orange, Traded Sites = Purple
          borderColor: ['#FF900E', '#914EFB'],
          borderWidth: 1,
        },
      ],
    }),
    [ownSiteRevenue, tradedSiteRevenue],
  );
  const config = {
    options: {
      responsive: true,
      maintainAspectRatio: false,
      radius: '77%',
      plugins: {
        legend: {
          display: true,
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 20,
            padding: 20,
          },
        },
        datalabels: {
          formatter: value => {
            const numericValue = Number(value); // Convert to number
            if (!isNaN(numericValue)) {
              return numericValue >= 1 ? Math.floor(numericValue) : numericValue.toFixed(1);
            }
            return ''; // Return empty string if conversion fails
          },
          color: '#000',
          anchor: 'end',
          align: 'end',
          // offset: 2,
        },
      },
      layout: {
        padding: {
          top: 5,
          bottom: 2,
        },
      },
    },
  };
  const aggregatedData = useMemo(() => {
    if (!bookingData) return {};

    const validClientTypes = Object.keys(clientTypeLabels);

    const result = {
      government: 0,
      nationalagency: 0,
      localagency: 0,
      directclient: 0,
    };

    bookingData.forEach(booking => {
      const totalAmount = booking?.totalAmount || 0;

      if (Array.isArray(booking.details) && booking.details.length > 0) {
        booking.details.forEach(detail => {
          const clientType = detail?.client?.clientType;

          if (clientType) {
            const normalizedClientType = clientType.toLowerCase().replace(/\s/g, '');
            if (validClientTypes.includes(normalizedClientType)) {
              result[normalizedClientType] += totalAmount / 100000;
            }
          }
        });
      }
    });

    return result;
  }, [bookingData]);

  const pieChartData = useMemo(() => {
    const labels = Object.keys(aggregatedData).map(clientType => clientTypeLabels[clientType]); // Use the mapping for labels
    const data = Object.values(aggregatedData);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue by Client Type',
          data,
          ...barDataConfigByClient.styles,
        },
      ],
    };
  }, [aggregatedData]);

  const [updatedClient, setUpdatedClient] = useState(pieChartData);

  useEffect(() => {
    if (bookingData) {
      setUpdatedClient(pieChartData);
    }
  }, [pieChartData, bookingData]);

  //For Pdf Download
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf1 = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Source_Distribution');

    html2pdf()
      .set({ filename: 'Source_DisReport.pdf', html2canvas: { scale: 2 } })
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

    const element = document.getElementById('Client_Distribution');

    html2pdf()
      .set({ filename: 'Client_DisReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className={classNames('flex gap-8 pt-4', isReport ? 'flex-col' : '')}>
      <div className='flex flex-col mt-2 p-4  min-h-[200px]' id="Source_Distribution" >
        <div className="flex justify-between">
          <p className="font-bold">Source Distribution</p>
          {isReport ? null : (
            <div className="flex items-start ">
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
        <p className="text-sm text-gray-600 italic py-4">
          This chart shows the revenue split between "Own Sites" and "Traded Sites".
        </p>
        <div className="w-72 justify-center mx-6">
          {isLoadingBookingData ? (
            <Loader className="mx-auto" />
          ) : (
            <Doughnut
              options={config.options}
              data={printSitesData}
              ref={chartRef}
              plugins={[ChartDataLabels, customLinesPlugin]}
            />
          )}
        </div>
      </div>
      <div
        className='flex flex-col p-4 min-h-[200px]'
        id="Client_Distribution"
      >
        <div className="flex justify-between">
          <p className="font-bold">Client Type Distribution</p>
          {isReport ? null : (
            <div className="flex items-start ">
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
        <p className="text-sm text-gray-600 italic pt-4">
          This chart breaks down revenue by client type, including "Direct Clients", "Local
          Agencies", "National Agencies", and "Government".
        </p>
        <div className="w-72 justify-center mx-6">
          {isLoadingBookingData ? (
            <Loader className="mx-auto" />
          ) : updatedClient && updatedClient.datasets[0].data.length > 0 ? (
            <Pie
              data={updatedClient}
              options={barDataConfigByClient.options}
              height={200}
              width={200}
              ref={chartRef}
              plugins={[ChartDataLabels, customLinesPlugin]}
            />
          ) : (
            <p className="text-center">NA</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceClientDistribution;
