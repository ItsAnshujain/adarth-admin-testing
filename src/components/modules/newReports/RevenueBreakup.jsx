import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, Image, Loader, Button } from '@mantine/core';
import {
  usebookingsRevenueBreakup,
} from '../../../apis/queries/booking.queries';
import { Doughnut } from 'react-chartjs-2';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';
import OngoingOrdersIcon from '../../../assets/ongoing-orders.svg';
import UpcomingOrdersIcon from '../../../assets/upcoming-orders.svg';
import CompletedOrdersIcon from '../../../assets/completed-orders.svg';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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

      const xLine = xEdge + Math.cos(angle) * 5;
      const yLine = yEdge + Math.sin(angle) * 5;

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

const RevenueBreakup = () => {
  const { data: bookingData, isLoading: isLoadingBookingData } = usebookingsRevenueBreakup();

  const chartRef = useRef(null);

  // Handle chart data based on backend response
  const revenueBreakupData = useMemo(() => {
    if (
      !bookingData ||
      !bookingData[0] ||
      !bookingData[0].clientTypes ||
      bookingData[0].clientTypes.length === 0
    ) {
      return { datasets: [], labels: [] };
    }

    const filteredClientTypes = bookingData[0].clientTypes.filter(client => client.clientType); // Only keep valid clientTypes
    const clientTypes = filteredClientTypes.map(client => client.clientType);
    const totalAmounts = filteredClientTypes.map(client => client.totalAmount / 100000); // Convert to Lakh

    return {
      datasets: [
        {
          data: totalAmounts,
          backgroundColor: ['#FF900E', '#914EFB', '#4BC0C0', '#2938F7'],
          borderColor: ['#FF900E', '#914EFB', '#4BC0C0', '#2938F7'],
          borderWidth: 1,
        },
      ],
    };
  }, [bookingData]);
  const config = {
    options: {
      responsive: true,

      plugins: {
        datalabels: {
          formatter: value => {
            const numericValue = Number(value);
            if (!isNaN(numericValue)) {
              return numericValue >= 1 ? Math.floor(numericValue) : numericValue.toFixed(1);
            }
            return '';
          },
          color: '#000',
          anchor: 'end',
          align: 'end',
          offset: 0.5,
        },
      },
      layout: {
        padding: {
          top: 7,
          bottom: 15,
          // left: 15,
          right: 15,
        },
      },
    },
  };
  const ongoing = bookingData?.[0]?.statuses?.find(status => status.status === 'Ongoing') || {};
  const upcoming = bookingData?.[0]?.statuses?.find(status => status.status === 'Upcoming') || {};
  const completed = bookingData?.[0]?.statuses?.find(status => status.status === 'Completed') || {};

  const ongoingRevenue = ongoing.totalAmount ? ongoing.totalAmount / 100000 : 0;
  const ongoingCount = ongoing.count || 0;

  const upcomingRevenue = upcoming.totalAmount ? upcoming.totalAmount / 100000 : 0;
  const upcomingCount = upcoming.count || 0;

  const completedRevenue = completed.totalAmount ? completed.totalAmount / 100000 : 0;
  const completedCount = completed.count || 0;
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Revenue_breakup');

    html2pdf()
      .set({ filename: 'Revenue_breakupReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };

  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  return (
    <div className={`${!isLoadingBookingData ? 'loading_completed' : ''} p-5`} id="Revenue_breakup">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex gap-4 p-4 border rounded-md items-center">
          <div className="w-32">
            {isLoadingBookingData ? (
              <Loader className="mx-auto" />
            ) : revenueBreakupData.labels?.length === 0 ? (
              <p className="text-center">NA</p>
            ) : (
              <Doughnut
                options={config.options}
                data={revenueBreakupData}
                ref={chartRef}
                plugins={[ChartDataLabels, customLinesPlugin]}
              />
            )}
          </div>

          <div>
            <div>
              <p className="font-medium">Revenue Breakup</p>
              <div className="flex gap-8 mt-6">
                {bookingData?.[0]?.clientTypes?.length > 0 &&
                  revenueBreakupData?.datasets?.[0]?.backgroundColor &&
                  bookingData[0].clientTypes
                    .filter(client => client.clientType) // Filter out clients where clientType is falsy
                    .map((client, index) => (
                      <div className="flex gap-2 items-center" key={index}>
                        <div
                          className="h-2 w-1 p-2 rounded-full"
                          style={{
                            backgroundColor:
                              revenueBreakupData.datasets[0].backgroundColor[index] || '#000', // Fallback color
                          }}
                        />
                        <div>
                          <Text size="sm" weight="200">
                            {client.clientType}
                          </Text>
                          <Text weight="bolder" size="md">
                            {(client.totalAmount / 100000).toFixed(2)} L
                          </Text>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>

        {isReport ? null : (
          <div className="flex items-start ">
            <Button
              className="primary-button mx-3 pdf_download_button"
              onClick={handleDownloadPdf}
              loading={isDownloadPdfLoading}
              disabled={isDownloadPdfLoading}
            >
              <Download size="20" color="white" />
            </Button>
          </div>
        )}

        <div className="flex gap-4">
          <div className="border rounded p-8 pr-16">
            <Image src={OngoingOrdersIcon} alt="ongoing" height={24} width={24} fit="contain" />
            <Text className="my-2" size="sm" weight="200">
              Ongoing Orders ({ongoingCount})
            </Text>
            <Text weight="bold">{ongoingRevenue.toFixed(2)} L</Text>
          </div>

          <div className="border rounded p-8 pr-16">
            <Image src={UpcomingOrdersIcon} alt="upcoming" height={24} width={24} fit="contain" />
            <Text className="my-2" size="sm" weight="200">
              Upcoming Orders ({upcomingCount})
            </Text>
            <Text weight="bold">{upcomingRevenue.toFixed(2)} L</Text>
          </div>

          <div className="border rounded p-8 pr-16">
            <Image src={CompletedOrdersIcon} alt="completed" height={24} width={24} fit="contain" />
            <Text className="my-2" size="sm" weight="200">
              Completed Orders ({completedCount})
            </Text>
            <Text weight="bold">{completedRevenue.toFixed(2)} L</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakup;
