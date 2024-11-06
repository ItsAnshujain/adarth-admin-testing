import { Download } from 'react-feather';
import { Button } from '@mantine/core';
import PerformanceCard from '../../components/modules/newReports/performanceCard';
import RevenueCards from '../../components/modules/newReports/RevenueCards';
import { downloadExcel } from '../../apis/requests/report.requests';
import { useDownloadExcel, useShareReport } from '../../apis/queries/report.queries';
import { showNotification } from '@mantine/notifications';
import TagwiseReport from '../../components/modules/newReports/TagwiseReport';
import SalesDistribution from '../../components/modules/newReports/SalesDistribution';
import SalesComparision from '../../components/modules/newReports/SalesComparision';
import RevenueDistribution from '../../components/modules/newReports/RevenueDistribution';
import CategoryWiseReport from '../../components/modules/newReports/CategoryWiseReport';
import RevenueAndIndustriGraph from '../../components/modules/newReports/RevenueAndIndustriGraph';
import SourceClientDistribution from '../../components/modules/newReports/SourceClientDistribution';
import OperationalCosts from '../../components/modules/newReports/OperationalCosts';
import PrintingMountingCosts from '../../components/modules/newReports/PrintingMountingCosts';
import CampaignDetails from '../../components/modules/newReports/CampaignDetails';
import ClientDetails from '../../components/modules/newReports/ClientDetails';
import PriceTradedMargin from '../../components/modules/newReports/PriceTradedMargin';
import InvoiceAmountCollReport from '../../components/modules/newReports/InvoiceAmountCollReport';
import RevenueBreakup from '../../components/modules/newReports/RevenueBreakup';
import CampaignCards from '../../components/modules/newReports/CampaingCards';
import SalesOverview from '../../components/modules/newReports/SalesOverview';
import classNames from 'classnames';
import { downloadPdf } from '../../utils';

const OtherNewReports = () => {
   // For PDF Download
   const { mutateAsync: mutateAsyncPdf, isLoading: isDownloadPdfLoading } = useShareReport();

   const handleDownloadPdf = async () => {
     const activeUrl = new URL(window.location.href);
     await mutateAsyncPdf(
       { url: activeUrl.toString() },
       {
         onSuccess: data => {
           showNotification({
             title: 'Report has been downloaded successfully',
             color: 'green',
           });
           if (data?.link) {
             downloadPdf(data.link);
           }
         },
       },
     );
   };

  // For Excel Download
  const { mutateAsync: mutateAsyncExcel, isLoading: isDownloadExcelLoading } = useDownloadExcel();

  const handleDownloadExcel = async () => {
    const activeUrl = new URL(window.location.href);

    await mutateAsyncExcel(
      { s3url: activeUrl.toString() },
      {
        onSuccess: data => {
          showNotification({
            title: 'Report has been downloaded successfully',
            color: 'green',
          });
          if (data?.link) {
            downloadExcel(data.link);
          }
        },
        onError: err => {
          showNotification({
            title: err?.message,
            color: 'red',
          });
        },
      },
    );
  };
  
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  return (
    <div
      className={classNames(
        'overflow-y-auto p-3 overflow-hidden',
        !isReport ? 'col-span-10 ' : 'col-span-12',
      )}
    >
      {!isReport ? (
        <div className="flex flex-end justify-end ">
          <div className="py-5 flex items-start">
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
          <div className="py-5 flex items-start">
            <Button
              leftIcon={<Download size="20" color="white" />}
              className="primary-button"
              onClick={handleDownloadExcel}
              loading={isDownloadExcelLoading}
              disabled={isDownloadExcelLoading}
            >
              Income Statement
            </Button>
          </div>
        </div>
      ) : null}

      <div id="New_reports">
        <div className="border-2 p-5 border-black">
          <p className="font-bold text-lg"> Revenue </p>
          <RevenueBreakup />
          <RevenueCards />
          <SourceClientDistribution />
          <RevenueDistribution />
          <RevenueAndIndustriGraph />
          <CategoryWiseReport />
          <SalesOverview />
        </div>
        <div className="border-2 p-5 border-black my-2">
          <p className="font-bold text-lg"> Trends </p>
          <TagwiseReport />
          <SalesDistribution />
          <SalesComparision />
        </div>
        <div className="border-2 p-5 border-black my-2">
          <OperationalCosts />
          <PrintingMountingCosts />
        </div>
        <div className="border-2 p-5 border-black my-2">
          <p className="font-bold text-lg"> Client Data</p>
          <CampaignCards />
          <CampaignDetails />
          <ClientDetails />
          <PriceTradedMargin />
        </div>
        <InvoiceAmountCollReport />
        <PerformanceCard />
      </div>
    </div>
  );
};

export default OtherNewReports;
