import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, Image, Loader, Button } from '@mantine/core';
import { useBookingsNew } from '../../../apis/queries/booking.queries';
import { Doughnut } from 'react-chartjs-2';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';
import OngoingOrdersIcon from '../../../assets/ongoing-orders.svg';
import UpcomingOrdersIcon from '../../../assets/upcoming-orders.svg';
import CompletedOrdersIcon from '../../../assets/completed-orders.svg';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import { serialize } from '../../../utils';

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

  const {
    data: bookingData2,
    isLoading: isLoadingBookingData,
    error,
  } = useBookingsNew(serialize({ page: 1, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' }));

  const chartRef = useRef(null);

  const aggregatedData2 = useMemo(() => {
    if (!bookingData2) return {};

    const validClientTypes = ['government', 'nationalagency', 'localagency', 'directclient']; // Define valid client types

    const result = {
      government: 0,
      nationalagency: 0,
      localagency: 0,
      directclient: 0,
    };

    bookingData2.forEach(booking => {
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
  }, [bookingData2]);

  const revenueBreakupData = useMemo(
    () => ({
      datasets: [
        {
          data: [
            aggregatedData2.directclient ?? 0,
            aggregatedData2.localagency ?? 0,
            aggregatedData2.nationalagency ?? 0,
            aggregatedData2.government ?? 0,
          ],
          backgroundColor: ['#FF900E', '#914EFB', '#4BC0C0', '#2938F7'],
          borderColor: ['#FF900E', '#914EFB', '#4BC0C0', '#2938F7'],
          borderWidth: 1,
        },
      ],
    }),
    [aggregatedData2],
  );
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
          top: 2,
          bottom: 15,
          // left: 15,
          right: 15,
        },
      },
    },
  };
  const today = dayjs();
  const calculateTotalRevenueAndCount = status => {
    if (!bookingData2) return { total: 0, count: 0 };

    let totalRevenue = 0;
    let count = 0;

    bookingData2.forEach(booking => {
      const { startDate, endDate } = booking.campaign || {};
      const bookingStart = dayjs(startDate);
      const bookingEnd = dayjs(endDate);

      // Determine the status of the booking
      if (status === 'Ongoing' && today.isAfter(bookingStart) && today.isBefore(bookingEnd)) {
        totalRevenue += booking.totalAmount || 0;
        count++;
      } else if (status === 'Upcoming' && today.isBefore(bookingStart)) {
        totalRevenue += booking.totalAmount || 0;
        count++;
      } else if (status === 'Completed' && today.isAfter(bookingEnd)) {
        totalRevenue += booking.totalAmount || 0;
        count++;
      }
    });

    return { total: totalRevenue, count };
  };

  // Calculate revenue and count for each order status
  const { total: ongoingRevenue, count: ongoingCount } = bookingData2
    ? calculateTotalRevenueAndCount('Ongoing')
    : { total: 0, count: 0 };

  const { total: upcomingRevenue, count: upcomingCount } = bookingData2
    ? calculateTotalRevenueAndCount('Upcoming')
    : { total: 0, count: 0 };

  const { total: completedRevenue, count: completedCount } = bookingData2
    ? calculateTotalRevenueAndCount('Completed')
    : { total: 0, count: 0 };
  // order details

  //For Pdf Download
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
            <p className="font-medium">Revenue Breakup</p>
            <div className="flex gap-8 mt-6">
              <div className="flex gap-2 items-center">
                <div className=" p-2 rounded-full bg-orange-350" />
                <div>
                  <Text size="sm" weight="200">
                    Direct Client
                  </Text>
                  <Text weight="bolder" size="md">
                    {aggregatedData2.directclient?.toFixed(2) || 0} L
                  </Text>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-purple-350 rounded-full" />
                <div>
                  <Text size="sm" weight="200">
                    Local Agency
                  </Text>
                  <Text weight="bolder" size="md">
                    {aggregatedData2.localagency?.toFixed(2) || 0} L
                  </Text>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-green-350 rounded-full" />
                <div>
                  <Text size="sm" weight="200">
                    National Agency
                  </Text>
                  <Text weight="bolder" size="md">
                    {aggregatedData2.nationalagency?.toFixed(2) || 0} L
                  </Text>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-blue-350 rounded-full" />
                <div>
                  <Text size="sm" weight="200">
                    Government
                  </Text>
                  <Text weight="bolder" size="md">
                    {aggregatedData2.government?.toFixed(2) || 0} L
                  </Text>
                </div>
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
            <Text weight="bold">
              {ongoingRevenue !== null && !isNaN(ongoingRevenue)
                ? `${(ongoingRevenue / 100000).toFixed(2)} L`
                : ''}
            </Text>
          </div>

          <div className="border rounded p-8 pr-16">
            <Image src={UpcomingOrdersIcon} alt="upcoming" height={24} width={24} fit="contain" />
            <Text className="my-2" size="sm" weight="200">
              Upcoming Orders ({upcomingCount})
            </Text>
            <Text weight="bold">
              {upcomingRevenue !== null && !isNaN(upcomingRevenue)
                ? `${(upcomingRevenue / 100000).toFixed(2)} L`
                : ''}
            </Text>
          </div>

          <div className="border rounded p-8 pr-16">
            <Image src={CompletedOrdersIcon} alt="completed" height={24} width={24} fit="contain" />
            <Text className="my-2" size="sm" weight="200">
              Completed Orders ({completedCount})
            </Text>
            <Text weight="bold">
              {completedRevenue !== null && !isNaN(completedRevenue)
                ? `${(completedRevenue / 100000).toFixed(2)} L`
                : ''}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakup;
