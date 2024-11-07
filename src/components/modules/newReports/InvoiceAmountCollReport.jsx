import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { Menu, Button } from '@mantine/core';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useFetchInventory } from '../../../apis/queries/inventory.queries';
import classNames from 'classnames';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
import { useBookings } from '../../../apis/queries/booking.queries';
import GaugeChart from './GaugeChart';
import InvoiceReportChart from './InvoiceReportChart';
import { generateSlNo } from '../../../utils';
import toIndianCurrency from '../../../utils/currencyFormat';
import Table1 from '../../Table/Table1';
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

const viewBy1 = {
  reset: '',
  past10Years: 'Past 10 Years',
  past5Years: 'Past 5 Years',
  previousYear: 'Previous Year',
  currentYear: 'Current Year',
  customDate: 'Custom Date Range',
};

const list1 = [
  { label: 'Past 10 Years', value: 'past10Years' },
  { label: 'Past 5 Years', value: 'past5Years' },
  { label: 'Previous Year', value: 'previousYear' },
  { label: 'Current Year', value: 'currentYear' },
  { label: 'Custom Date Range', value: 'customDate' },
];
const InvoiceAmountCollReport = () => {
  const [searchParams] = useSearchParams({
    page: 1,
    limit: 1000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';


  const { data: bookingData, isLoading: isLoadingBookingData } = useBookings(
    searchParams.toString(),
  );
  const [startDate2, setStartDate2] = useState(null);
  const [endDate2, setEndDate2] = useState(null);
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  const [activeView1, setActiveView1] = useState('currentYear');

  const formatMonthYear1 = (monthYearKey) => {
    const [year, month] = monthYearKey.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    
    return `${monthName} ${year}`;
};

  const getFinancialYear = date => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Financial year starts in April
    if (month >= 4) {
      return { startYear: year, endYear: year + 1 };
    } else {
      return { startYear: year - 1, endYear: year };
    }
  };

  const getFilteredData1 = (data, view, startDate2, endDate2) => {
    if (!data) return [];

    const now = new Date();
    const { startYear: currentFYStartYear } = getFinancialYear(now);

    let startDate, endDate;

    switch (view) {
      case 'past10Years':
        startDate = new Date(currentFYStartYear - 10, 3, 1);
        endDate = new Date(currentFYStartYear, 2, 31);
        break;
      case 'past5Years':
        startDate = new Date(currentFYStartYear - 5, 3, 1);
        endDate = new Date(currentFYStartYear, 2, 31);
        break;
      case 'previousYear':
        startDate = new Date(currentFYStartYear - 1, 3, 1);
        endDate = new Date(currentFYStartYear, 2, 31);
        break;
      case 'currentYear':
        startDate = new Date(currentFYStartYear, 3, 1);
        endDate = new Date(currentFYStartYear + 1, 2, 31);
        break;
      case 'customDate':
        startDate = startDate2;
        endDate = endDate2;
        break;
      default:
        startDate = null;
        endDate = null;
    }

    const grouped1 = {};

    data.docs.forEach(doc => {
      const date = new Date(doc.createdAt);
      const monthYearKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!grouped1[monthYearKey]) {
        grouped1[monthYearKey] = [];
      }
      grouped1[monthYearKey].push(doc);
    });

    const aggregatedData1 = Object.keys(grouped1)
      .map(monthYearKey => {
        const group = grouped1[monthYearKey];
        const totalInvoiceRaised =
          group.reduce((sum, doc) => sum + (doc.outStandingInvoice || 0), 0) / 100000;
        const totalAmountCollected =
          group.reduce((sum, doc) => sum + (doc.totalPayment || 0), 0) / 100000;
        const totalOutstanding = (totalInvoiceRaised - totalAmountCollected).toFixed(2);

        const date = new Date(`${monthYearKey}-01`);
        if ((startDate && date < startDate) || (endDate && date > endDate)) {
          return null;
        }

        if (totalInvoiceRaised >= 0 && totalAmountCollected >= 0 && totalOutstanding >= 0) {
          return {
            monthYearKey,
            month: formatMonthYear1(group[0].createdAt),
            outStandingInvoice: totalInvoiceRaised,
            totalPayment: totalAmountCollected,
            outstandingAmount: totalOutstanding,
          };
        }
        return null;
      })
      .filter(item => item !== null);

    return aggregatedData1.sort((a, b) => {
      const [yearA, monthA] = a.monthYearKey.split('-').map(Number);
      const [yearB, monthB] = b.monthYearKey.split('-').map(Number);

      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });
  };

  const groupedData1 = useMemo(() => {
    return getFilteredData1(bookingData, activeView1, startDate2, endDate2).sort((a, b) => {
      const [yearA, monthA] = a.monthYearKey.split('-').map(Number);
      const [yearB, monthB] = b.monthYearKey.split('-').map(Number);

      return yearA !== yearB ? yearB - yearA : monthB - monthA;
    });
  }, [bookingData?.docs, activeView1, startDate2, endDate2]);

  const column1 = useMemo(
    () => [
      {
        Header: '#',
        accessor: 'id',
        disableSortBy: true,
        Cell: info => useMemo(() => <p>{generateSlNo(info.row.index, 1, 1000)}</p>, []),
      },
      {
        Header: 'Month',
        accessor: 'month',
        disableSortBy: true,
        Cell: info => <p>{info.row.original.month}</p>,
      },
      {
        Header: 'Invoice Raised ',
        accessor: 'outStandingInvoice',
        disableSortBy: true,
        Cell: info => <p>{toIndianCurrency(info.row.original.outStandingInvoice)}</p>,
      },
      {
        Header: 'Amount Collected ',
        accessor: 'totalPayment',
        disableSortBy: true,
        Cell: info => <p>{toIndianCurrency(info.row.original.totalPayment)}</p>,
      },
      {
        Header: 'Outstanding',
        accessor: 'outstandingAmount (lac)',
        disableSortBy: true,
        Cell: info => <p>{toIndianCurrency(info.row.original.outstandingAmount)}</p>,
      },
    ],
    [groupedData1],
  );

  const handleMenuItemClick1 = value => {
    setActiveView1(value);
  };

  const handleReset1 = () => {
    setActiveView1('currentYear');
    setStartDate2(null);
    setEndDate2(null);
  };

  const onDateChange5 = val => {
    setStartDate2(val[0]);
    setEndDate2(val[1]);
  };

  const invoiceRaised = groupedData1?.reduce((acc, item) => acc + item.outStandingInvoice, 0);

  const amountCollected = groupedData1?.reduce((acc, item) => acc + item.totalPayment, 0);

  const isFilterApplied = activeView1 !== '';

  // invoice report
  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('invoice_report');

    html2pdf()
      .set({ filename: 'InvoiceReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className={classNames("col-span-12 lg:col-span-10 p-5 overflow-hidden", !isReport?'':'pt-12')} id="invoice_report">
      <div className="flex justify-between">
        <p className="font-bold ">Invoice and amount collected Report</p>
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
        This report provide insights into the invoice raised, amount collected and outstanding by
        table, graph and chart.
      </p>
      
      <div className="flex flex-col lg:flex-row gap-10  overflow-x-auto">
        <div className="overflow-y-auto w-[600px]">
        <div className="flex pb-4">
        <div>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button className="secondary-button">
                View By: {viewBy1[activeView1] || 'Select'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {list1.map(({ label, value }) => (
                <Menu.Item
                  key={value}
                  onClick={() => handleMenuItemClick1(value)}
                  className={classNames(activeView1 === value && 'text-purple-450 font-medium')}
                >
                  {label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>

        {activeView1 && !isReport && (
          <Button onClick={handleReset1} className="mx-2 secondary-button">
            Reset
          </Button>
        )}
        {
          <div>
            {' '}
            <p className="text-sm text-gray-600 italic ml-[50px]"> (Amounts in Lacs)</p>
          </div>
        }
      </div>
      {activeView1 === 'customDate' && (
        <div className="flex flex-col items-start space-y-4 py-2 ">
          <DateRangeSelector
            dateValue={[startDate2, endDate2]}
            onChange={onDateChange5}
            minDate={threeMonthsAgo}
            maxDate={today}
          />
        </div>
      )}
          <Table1
            data={groupedData1 || []}
            COLUMNS={column1}
            loading={isLoadingBookingData}
            showPagination={false}
          />
        </div>

        <div className="flex flex-col">
          <GaugeChart
            invoiceRaised={isFilterApplied ? invoiceRaised : 0}
            amountCollected={isFilterApplied ? amountCollected : 0}
          />
        </div>
      </div>
      <div className={classNames('flex flex-col ', !isReport ? 'items-center' : '')}>
        <p className="pt-4 pb-2 font-bold">Invoice Raised Vs Amount Collected Vs Outstanding</p>
        <InvoiceReportChart
          data={activeView1 ? groupedData1 : []}
          chartDataLabels={[ChartDataLabels]}
          isReport={isReport}
        />{' '}
      </div>
    </div>
  );
};

export default InvoiceAmountCollReport;
