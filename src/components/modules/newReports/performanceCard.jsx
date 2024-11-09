import { useEffect, useState } from 'react';
import { Text, Image, Button } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import toIndianCurrency from '../../../utils/currencyFormat';
import { useFetchInventoryReportList } from '../../../apis/queries/inventory.queries';
import OngoingOrdersIcon from '../../../assets/ongoing-orders.svg';
import TotalRevenueIcon from '../../../assets/total-revenue.svg';
import InitiateDiscussionIcon from '../../../assets/message-share.svg';
import InProgressIcon from '../../../assets/git-branch.svg';
import classNames from 'classnames';
import html2pdf from 'html2pdf.js';
import { Download } from 'react-feather';
import { serialize } from '../../../utils';
const PerformanceCard = () => {
  const { data: inventoryReportList, isLoading: inventoryReportListLoading } =
    useFetchInventoryReportList(serialize({
      limit: 10000,
      page: 1,
      sortOrder: 'desc',
      sortBy: 'revenue',
    }));

  const topSpaceByBookings = inventoryReportList?.docs.reduce((prev, curr) =>
    prev.totalBookings > curr.totalBookings ? prev : curr,
  );

  const leastSpaceByBookings = inventoryReportList?.docs.reduce((prev, curr) =>
    prev.totalBookings < curr.totalBookings ? prev : curr,
  );

  const topSpaceByRevenue = inventoryReportList?.docs.reduce((prev, curr) =>
    prev.revenue > curr.revenue ? prev : curr,
  );

  const leastSpaceByRevenue = inventoryReportList?.docs.reduce((prev, curr) =>
    prev.revenue < curr.revenue ? prev : curr,
  );

  const cardData = [
    {
      title: 'Top Performing Space by Bookings',
      data: {
        name: topSpaceByBookings?.basicInformation?.spaceName || 'N/A',
        value: topSpaceByBookings?.totalBookings || 0,
        label: 'Bookings ',
        icon: OngoingOrdersIcon,
        color: '#4C3BCF',
      },
    },
    {
      title: 'Least Performing Space by Bookings',
      data: {
        name: leastSpaceByBookings?.basicInformation?.spaceName || 'N/A',
        value: leastSpaceByBookings?.totalBookings || 0,
        label: 'Bookings ',
        icon: InitiateDiscussionIcon,
        color: '#FF7F3E',
      },
    },
    {
      title: 'Top Performing Space by Revenue',
      data: {
        name: topSpaceByRevenue?.basicInformation?.spaceName || 'N/A',
        value: toIndianCurrency((topSpaceByRevenue?.revenue || 0) / 100000), // Convert to lacs
        label: 'Revenue (lac)',
        icon: TotalRevenueIcon,
        color: '#059212',
      },
    },
    {
      title: 'Least Performing Space by Revenue',
      data: {
        name: leastSpaceByRevenue?.basicInformation?.spaceName || 'N/A',
        value: toIndianCurrency((leastSpaceByRevenue?.revenue || 0) / 100000), // Convert to lacs
        label: 'Revenue (lac)',
        icon: InProgressIcon,
        color: '#7A1CAC',
      },
    },
  ];
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('PerformanceCards');

    html2pdf()
      .set({ filename: 'PerformanceCardsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div
      className={classNames(
        'px-5 lg:col-span-10 col-span-12',
      )}
      id="PerformanceCards"
    >
      <div className="flex justify-between">
        <p className="font-bold">Performance Ranking Report</p>
        {isReport ? null : (
          <div className=" ">
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
      <p className="text-sm text-gray-600 italic py-4">
        This report shows Performance Cards with pagination controls and a sortable, paginated
        table.
      </p>
      <div
        className={classNames('grid grid-cols-1 lg:grid-cols-4 gap-4')}
        
      >
        {cardData.map(({ title, data }) => (
          <div className="border rounded p-8 flex-1" key={title}>
            <Image src={data.icon} alt="icon" height={24} width={24} fit="contain" />
            <Text className="my-2 text-sm font-semibold ">{title}</Text>
            <Text size="sm" weight="200">
              {data.name}
            </Text>
            <Text size="sm" weight="200">
              {data.label}:{' '}
              <span className="font-bold" style={{ color: data.color }}>
                {' '}
                {data.value}
              </span>
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceCard;
