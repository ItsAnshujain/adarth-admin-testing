import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { Menu, Button } from '@mantine/core';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(quarterOfYear);
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  LogarithmicScale,
} from 'chart.js';
import { useBookingsNew } from '../../../apis/queries/booking.queries';
import Table from '../../Table/Table';
import Table1 from '../../Table/Table1';
import classNames from 'classnames';
import { Download } from 'react-feather';
import html2pdf from 'html2pdf.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  LogarithmicScale,
);
const viewBy2 = {
  reset: '',
  newInclusion: 'New Inclusion',
  oldRetention: 'Old Retention',
};

const list2 = [
  { label: 'New Inclusion', value: 'newInclusion' },
  { label: 'Old Retention', value: 'oldRetention' },
];
const ClientDetails = () => {
  const [searchParams] = useSearchParams({
    page: 1,
    limit: 1000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  const { data: bookingData2, isLoading: isLoadingBookingData } = useBookingsNew(
    searchParams.toString(),
  );

  // client details
  const getFinancialYear1 = date => {
    const fiscalYearStartMonth = 4; // April
    const currentDate = new Date();
    const fiscalYearStart = new Date(currentDate.getFullYear(), fiscalYearStartMonth - 1, 1);
    return date >= fiscalYearStart ? 'newInclusion' : 'oldRetention';
  };
  const [filter2, setFilter2] = useState('');
  const [activeView2, setActiveView2] = useState('');

  const handleReset2 = () => {
    setFilter2('');
    setActiveView2('');
  };

  const handleMenuItemClick2 = value => {
    setFilter2(value);
    setActiveView2(value);
  };

  const tableData4 = useMemo(() => {
    if (!bookingData2) return [];

    return bookingData2
      .map(booking => {
        const { totalAmount, details, campaign } = booking;
        const firstDetail = details[0] || {};
        const client = firstDetail.client || {};

        if (!client.clientType) return null;

        const firstBookingDate = new Date(booking.createdAt);
        const revenue = (totalAmount / 100000).toFixed(2) || 0;

        const totalOperationalCost = (campaign?.spaces?.operationalCosts || []).reduce(
          (sum, cost) => sum + cost.amount,
          0,
        );

        const profitability =
          revenue > 0
            ? (((revenue * 100000 - totalOperationalCost) / (revenue * 100000)) * 100).toFixed(2) +
              '%'
            : '0%';

        const retentionStatus = getFinancialYear1(firstBookingDate);
        if (filter2 && retentionStatus !== filter2) {
          return null;
        }

        const timeline = firstBookingDate.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        return {
          clientCategory: client.clientType,
          name: client.name || 'N/A',
          timeline,
          retentionStatus: viewBy2[retentionStatus],
          revenue,
          profitability,
        };
      })
      .filter(Boolean);
  }, [bookingData2, filter2]);

  const tableColumns4 = useMemo(() => {
    return [
      {
        Header: 'Client Type Category',
        accessor: 'clientCategory',
        disableSortBy: true,
      },
      {
        Header: 'Names',
        accessor: 'name',
        disableSortBy: true,
      },
      {
        Header: 'TimeLine',
        accessor: 'timeline',
        disableSortBy: true,
      },
      {
        Header: 'Retention Status',
        accessor: 'retentionStatus',
        disableSortBy: true,
      },
      {
        Header: 'Revenue (lac)',
        accessor: 'revenue',
        disableSortBy: true,
      },
      {
        Header: 'Profitability (%)',
        accessor: 'profitability',
        disableSortBy: true,
      },
    ];
  }, []);

  // client details
  //For Pdf Download

  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Client_details');

    html2pdf()
      .set({ filename: 'Client_detailsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className="flex flex-col col-span-10 overflow-x-hidden p-5" id='Client_details'>
      <div className="">
        <div className='flex justify-between'>
        <p className="font-bold ">Client Details</p>
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
          This report shows the client details based on retention status.
        </p>
        <div className="flex">
          <div>
            <Menu shadow="md" width={130}>
              <Menu.Target>
                <Button className="secondary-button">
                  View By: {viewBy2[activeView2] || 'Retention Status'}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {list2.map(({ label, value }) => (
                  <Menu.Item
                    key={value}
                    onClick={() => handleMenuItemClick2(value)}
                    className={
                      activeView2 === value && label !== 'Reset'
                        ? 'text-purple-450 font-medium'
                        : ''
                    }
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </div>
          <div>
            {filter2 && !isReport && (
              <Button onClick={handleReset2} className="mx-2 secondary-button">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className=" mt-5 col-span-12 md:col-span-12 lg:col-span-10 border-gray-450 overflow-auto">
        <Table1
          COLUMNS={tableColumns4}
          data={tableData4}
          loading={isLoadingBookingData}
          showPagination={false}
        />
      </div>
    </div>
  );
};

export default ClientDetails;
