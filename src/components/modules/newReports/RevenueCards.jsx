import { useEffect, useState } from 'react';
import { Text, Image, Button } from '@mantine/core';
import OngoingOrdersIcon from '../../../assets/ongoing-orders.svg';
import InitiateDiscussionIcon from '../../../assets/message-share.svg';
import TotalRevenueIcon from '../../../assets/total-revenue.svg';
import { useSearchParams } from 'react-router-dom';
import { useBookingReportByRevenueStats, useBookings } from '../../../apis/queries/booking.queries';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween'; // Import the isBetween plugin
import advancedFormat from 'dayjs/plugin/advancedFormat'; // Optional: for better date formatting
import toIndianCurrency from '../../../utils/currencyFormat';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';

import ProposalSentIcon from '../../../assets/proposal-sent.svg';
dayjs.extend(isBetween); // Extend dayjs with the isBetween plugin
dayjs.extend(advancedFormat); // Optional: For advanced date formatting
import { useFetchProposals } from '../../../apis/queries/proposal.queries';
const RevenueCards = () => {
  const [searchParams] = useSearchParams({
    page: 1,
    limit: 1000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const {
    data: bookingData,
    isLoading: isLoadingBookingData,
    error,
  } = useBookings(searchParams.toString());

  const { data: revenueData } = useBookingReportByRevenueStats();
  // Helper function to calculate MTD revenue and range
  const getMonthToDateRevenue = bookings => {
    const startOfMonth = dayjs().startOf('month');
    const endOfToday = dayjs().endOf('day');

    const filteredBookings = bookings.filter(booking =>
      dayjs(booking.createdAt).isBetween(startOfMonth, endOfToday, null, '[]'),
    );

    const totalRevenue = filteredBookings.reduce(
      (total, booking) => total + (booking.totalAmount || 0),
      0,
    );

    return {
      totalRevenue,
      dateRange: `${startOfMonth.format('D MMM, YYYY')} - ${endOfToday.format('D MMM, YYYY')}`, // Date range
    };
  };

  // Helper function to calculate YTD revenue (from April 1st to today's date) and range
  const getYearToDateRevenue = bookings => {
    const startOfFinancialYear = dayjs().month(3).startOf('month'); // April (month 3 in dayjs)
    const endOfToday = dayjs().endOf('day');

    const filteredBookings = bookings.filter(booking =>
      dayjs(booking.createdAt).isBetween(startOfFinancialYear, endOfToday, null, '[]'),
    );

    const totalRevenue = filteredBookings.reduce(
      (total, booking) => total + (booking.totalAmount || 0),
      0,
    );

    return {
      totalRevenue,
      dateRange: `${startOfFinancialYear.format('D MMM, YYYY')} - ${endOfToday.format(
        'D MMM, YYYY',
      )}`, // Date range
    };
  };

  const monthToDateData = bookingData
    ? getMonthToDateRevenue(bookingData.docs)
    : { totalRevenue: 0, dateRange: '' };
  const yearToDateData = bookingData
    ? getYearToDateRevenue(bookingData.docs)
    : { totalRevenue: 0, dateRange: '' };

  const cardData = [
    {
      title: 'Month to Date',
      data: {
        name: monthToDateData.dateRange || 'N/A', // Display the MTD date range
        value: (monthToDateData.totalRevenue / 100000).toFixed(2) || 0,
        label: 'Revenue (lac)',
        icon: OngoingOrdersIcon,
        color: '#4C3BCF',
      },
    },
    {
      title: 'Year to Date',
      data: {
        name: yearToDateData.dateRange || 'N/A', // Display the YTD date range
        value: (yearToDateData.totalRevenue / 100000).toFixed(2) || 0,
        label: 'Revenue (lac)',
        icon: InitiateDiscussionIcon,
        color: '#FF7F3E',
      },
    },
  ];
  //For Pdf Download
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Revenue_cards');

    html2pdf()
      .set({ filename: 'Revenue_CardsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };

  // proposals data
  const [searchParams4, setSearchParams4] = useSearchParams({
    page: 1,
    limit: 500,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: proposalsData, isLoading: isLoadingProposalsData } = useFetchProposals(
    searchParams4.toString(),
  );

  const proposalsArray = Array.isArray(proposalsData?.docs) ? proposalsData.docs : [];

  const totalProposalsCreated = proposalsArray.length;
  const totalPrice = proposalsArray.reduce((acc, proposal) => acc + (proposal.price || 0), 0);

  const totalPriceInLacs = (totalPrice / 100000).toFixed(2);

  // proposals data
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  return (
    <>
      <div className="overflow-y-auto px-5 pt-5 col-span-10 w-[65rem]" id="Revenue_cards">
        <div className="flex justify-between w-[47rem]">
          <p className="font-bold"> Revenue Cards</p>
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
        </div>
        <p className="text-sm text-gray-600 italic py-4">This report shows total revenue Cards.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded p-8 flex-1">
            <Image src={TotalRevenueIcon} alt="folder" fit="contain" height={24} width={24} />
            <p className="my-2 text-sm font-light text-slate-400">Total Revenue (till date)</p>
            <p className="font-bold text-green-500">
              {toIndianCurrency(revenueData?.revenue ?? 0)}
            </p>
          </div>
          {cardData.map(({ title, data }) => (
            <div className="border rounded p-8 flex-1" key={title}>
              <Image src={data.icon} alt="icon" height={24} width={24} fit="contain" />
              <Text className="my-2 text-sm font-light text-slate-400">{title}</Text>
              <Text size="xs" weight="400">
                ({data.name}) {/* Date range displayed here */}
              </Text>
              <p size="sm" weight="200">
                {data.label}:{' '}
                <span className="font-bold" style={{ color: data.color }}>
                  {' '}
                  {data.value}
                </span>
              </p>
            </div>
          ))}
        </div>
        <div className="">
          <div className="border rounded p-8 flex-1 w-72">
            <Image src={ProposalSentIcon} alt="folder" fit="contain" height={24} width={24} />
            <p className="my-2 text-sm">
              Total Proposals Created :{' '}
              <span className="font-bold text-[17px]">{totalProposalsCreated}</span>
            </p>

            <p className="font-bold">{totalPriceInLacs} L</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RevenueCards;
