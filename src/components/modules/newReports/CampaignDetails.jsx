import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { Menu, Button, MultiSelect, Text } from '@mantine/core';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useDistinctAdditionalTags } from '../../../apis/queries/inventory.queries';
import classNames from 'classnames';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { useBookings, useBookingsNew } from '../../../apis/queries/booking.queries';
import { useFetchMasters } from '../../../apis/queries/masters.queries';
import { generateSlNo, serialize } from '../../../utils';
import { Link } from 'react-router-dom';
import toIndianCurrency from '../../../utils/currencyFormat';
import { DATE_FORMAT } from '../../../utils/constants';
import Table1 from '../../Table/Table1';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';

const CampaignDetails = () => {

  const { data: bookingData, isLoading: isLoadingBookingData } = useBookings(
    serialize({ page: 1, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' }),
  );

  const { data: campaignStatus } = useFetchMasters(
    serialize({
      type: 'booking_campaign_status',
      parentId: null,
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'desc',
    }),
  );
  const { data: paymentStatus } = useFetchMasters(
    serialize({
      type: 'payment_status',
      parentId: null,
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'desc',
    }),
  );

  const column5 = useMemo(
    () => [
      {
        Header: '#',
        accessor: 'id',
        disableSortBy: true,
        Cell: info => useMemo(() => <p>{generateSlNo(info.row.index, 1, 1000)}</p>, []),
      },
      {
        Header: 'CAMPAIGN NAME',
        accessor: 'campaign.name',
        disableSortBy: true,
        Cell: ({
          row: {
            original: { campaign, _id },
          },
        }) =>
          useMemo(
            () => (
              <Link to={`/bookings/view-details/${_id}`} className="text-purple-450 font-medium">
                <Text
                  className="overflow-hidden text-ellipsis max-w-[180px] underline"
                  lineClamp={1}
                  title={campaign?.name}
                >
                  {campaign?.name || '-'}
                </Text>
              </Link>
            ),
            [],
          ),
      },

      {
        Header: 'CLIENT TYPE',
        accessor: 'client.clientType',
        disableSortBy: true,
        Cell: ({
          row: {
            original: { client },
          },
        }) =>
          useMemo(
            () => (
              <Text className="overflow-hidden text-ellipsis max-w-[180px]" lineClamp={1}>
                {client?.clientType || '-'}
              </Text>
            ),
            [],
          ),
      },
      {
        Header: 'OUTSTANDING AMOUNT',
        accessor: 'outstandingAmount',
        disableSortBy: true,
        Cell: info =>
          useMemo(
            () => (
              <p>
                {info.row.original.unpaidAmount
                  ? toIndianCurrency(info.row.original.unpaidAmount)
                  : '-'}
              </p>
            ),
            [],
          ),
      },
      {
        Header: 'CAMPAIGN AMOUNT',
        accessor: 'campaign.totalPrice',
        disableSortBy: true,
        Cell: ({
          row: {
            original: { campaign },
          },
        }) =>
          useMemo(
            () => (
              <div className="flex items-center justify-between max-w-min">
                {toIndianCurrency(campaign?.totalPrice || 0)}
              </div>
            ),
            [],
          ),
      },

      {
        Header: 'BOOKING DURATION',
        accessor: 'schedule',
        disableSortBy: true,
        Cell: ({
          row: {
            original: { campaign },
          },
        }) =>
          useMemo(
            () => (
              <div className="flex items-center w-max">
                <p className="font-medium bg-gray-450 px-2 rounded-sm min-w-[120px] text-center">
                  {campaign?.startDate ? (
                    dayjs(campaign?.startDate).format(DATE_FORMAT)
                  ) : (
                    <NoData type="na" />
                  )}
                </p>
                <span className="px-2">&gt;</span>
                <p className="font-medium bg-gray-450 px-2 rounded-sm min-w-[120px] text-center">
                  {campaign?.endDate ? (
                    dayjs(campaign?.endDate).format(DATE_FORMAT)
                  ) : (
                    <NoData type="na" />
                  )}
                </p>
              </div>
            ),
            [],
          ),
      },
    ],
    [bookingData?.docs, campaignStatus, paymentStatus],
  );
  const sortedBookingData = useMemo(() => {
    if (!bookingData?.docs) return [];

    return bookingData.docs.sort((a, b) => {
      const aPrice = a?.campaign?.totalPrice || 0; 
      const bPrice = b?.campaign?.totalPrice || 0;

      return bPrice - aPrice; 
    });
  }, [bookingData?.docs]);

  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';
  //For Pdf Download

  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Campaign_details');

    html2pdf()
      .set({ filename: 'Campaign_detailsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div id='Campaign_details'>
      <div className="flex flex-col overflow-hidden px-5">
        <div className="py-6 flex justify-between">
          <p className="font-bold ">Campaign Details</p>
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
      </div>
      <div className="px-5 col-span-12 md:col-span-12 lg:col-span-10 border-gray-450  overflow-auto">
        <Table1
          data={sortedBookingData} 
          COLUMNS={column5}
          loading={isLoadingBookingData}
          showPagination={false}
          initialState={{
            sortBy: [
              {
                id: 'campaign.totalPrice',
                desc: true,
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default CampaignDetails;
