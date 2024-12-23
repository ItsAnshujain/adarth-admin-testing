import { useMemo, useState } from 'react';
import {
  useFetchInventory,
  useFetchTradedMarginInventory,
} from '../../../apis/queries/inventory.queries';
import { generateSlNo, serialize } from '../../../utils';
import Table1 from '../../Table/Table1';
import html2pdf from 'html2pdf.js';
import { Button } from '@mantine/core';
import { Download } from 'react-feather';
import classNames from 'classnames';

const PriceTradedMargin = () => {
  const { data: tradedMarginData, isLoading: isLoadingTradedMarginData } =
    useFetchTradedMarginInventory(
      serialize({
        sortBy: 'city',
        sortOrder: 'desc',
        isActive: true,
      }),
    );
  const processedData = useMemo(() => {
    if (!tradedMarginData?.cityData) return [];

    // Convert cityData object to an array
    return Object.entries(tradedMarginData.cityData).map(([key, value]) => ({
      ...value,
      id: key, // Use the city name or a unique key as the ID
    }));
  }, [tradedMarginData]);

  const columns3 = useMemo(
    () => [
      {
        Header: '#',
        accessor: 'id',
        disableSortBy: true,
        Cell: info => <p>{info.row.index + 1}</p>,
      },
      {
        Header: 'City',
        accessor: 'city',
        disableSortBy: true,
        Cell: info => <p>{info.value}</p>,
      },
      {
        Header: 'Price ',
        accessor: 'totalPrice',
        disableSortBy: true,
        Cell: info => <p>{(info.value / 100000).toFixed(2)}</p>,
      },
      {
        Header: 'Traded Price',
        accessor: 'totalTradedAmount',
        disableSortBy: true,
        Cell: info => <p>{(info.value / 100000).toFixed(2)}</p>,
      },
      {
        Header: 'Traded Margin',
        accessor: 'tradedMargin',
        disableSortBy: true,
        Cell: info => <p>{(info.value / 100000).toFixed(2)}</p>,
      },
      {
        Header: 'Percentage Margin (%)',
        accessor: 'percentageMargin',
        disableSortBy: true,
        Cell: info => {
          const percentageMargin =
            isNaN(info.value) || info.value === null ? '-' : `${info.value}%`;
          return <p>{percentageMargin}</p>;
        },
      },
    ],
    [],
  );

  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('TradedMargin_report');

    html2pdf()
      .set({ filename: 'TradedMarginReport.pdf', html2canvas: { scale: 2 } })
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
      className="col-span-12 md:col-span-12 lg:col-span-10 overflow-y-auto p-5"
      id="TradedMargin_report"
    >
      <div className="flex justify-between">
        <p className="font-bold">Price and Traded Margin Report</p>
        {isReport ? null : (
          <div className="">
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
        This report provides insights into the pricing trends, traded prices, and margins grouped by
        cities. (Amounts in Lacs)
      </p>
      <div className={classNames('overflow-y-auto', isReport ? 'w-[40rem]' : '')}>
        <Table1
          data={processedData || []}
          COLUMNS={columns3}
          loading={isLoadingTradedMarginData}
          showPagination={false}
        />
      </div>
    </div>
  );
};

export default PriceTradedMargin;
