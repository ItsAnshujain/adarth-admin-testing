import { useEffect, useState } from 'react';
import { Text, Image, Button } from '@mantine/core';
import OngoingOrdersIcon from '../../../assets/ongoing-orders.svg';
import UpcomingOrdersIcon from '../../../assets/upcoming-orders.svg';
import CompletedOrdersIcon from '../../../assets/completed-orders.svg';
import { useSearchParams } from 'react-router-dom';
import { useBookingsNew } from '../../../apis/queries/booking.queries';
import dayjs from 'dayjs';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';
const OrderDetails = () => {
  const [searchParams] = useSearchParams({
    page: 1,
    limit: 1000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const {
    data: bookingData2,
    isLoading: isLoadingBookingData,
    error,
  } = useBookingsNew(searchParams.toString());

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

  //For Pdf Download
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('order_details');

    html2pdf()
      .set({ filename: 'Order_DetailsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className="flex">
      <div className="flex gap-4 px-5 flex-wrap" id="order_details">
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
      <div className="flex items-start ">
        <Button
          leftIcon={<Download size="20" color="white" />}
          className="primary-button mx-3 pdf_download_button"
          onClick={handleDownloadPdf}
          loading={isDownloadPdfLoading}
          disabled={isDownloadPdfLoading}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
};

export default OrderDetails;
