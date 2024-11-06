import { useEffect, useMemo, useState } from 'react';
import { Text, Image, Loader, Button } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useBookingsNew } from '../../../apis/queries/booking.queries';
import { useFetchProposals } from '../../../apis/queries/proposal.queries';

import ProposalSentIcon from '../../../assets/proposal-sent.svg';
import { useCampaignStats } from '../../../apis/queries/campaigns.queries';
import { Doughnut } from 'react-chartjs-2';
import classNames from 'classnames';
import html2pdf from 'html2pdf.js';
import { Download } from 'react-feather';
const CampaignCards = () => {
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';

  const config = {
    type: 'line',
    options: { responsive: true },
  };

  const { data: stats, isLoading: isStatsLoading } = useCampaignStats();
  const printStatusData = useMemo(
    () => ({
      datasets: [
        {
          data: [stats?.printCompleted ?? 0, stats?.printOngoing ?? 0],
          backgroundColor: ['#914EFB', '#FF900E'],
          borderColor: ['#914EFB', '#FF900E'],
          borderWidth: 1,
        },
      ],
    }),
    [stats],
  );

  const mountStatusData = useMemo(
    () => ({
      datasets: [
        {
          data: [stats?.mountCompleted ?? 0, stats?.mountOngoing ?? 0],
          backgroundColor: ['#914EFB', '#FF900E'],
          borderColor: ['#914EFB', '#FF900E'],
          borderWidth: 1,
        },
      ],
    }),
    [stats],
  );
  //For Pdf Download

  const [isDownloadPdfLoading, setIsDownloadPdfLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloadPdfLoading(true);

    const url = new URL(window.location);
    url.searchParams.set('share', 'report');
    window.history.pushState({}, '', url);

    const element = document.getElementById('Campaign_cards');

    html2pdf()
      .set({ filename: 'Campaign_cardsReport.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save()
      .finally(() => {
        setIsDownloadPdfLoading(false);
        url.searchParams.delete('share');
        window.history.pushState({}, '', url);
      });
  };
  return (
    <div className="px-5" id="Campaign_cards">
      <div className="flex justify-between">
        <p className='font-bold py-4'>
          Campaigns stats report
        </p>
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
      <div className="flex w-1/3 gap-4 h-[250px] ">
        <div className="flex gap-4 p-4 border rounded-md items-center min-h-[200px]">
          <div className="w-32">
            {isStatsLoading ? (
              <Loader className="mx-auto" />
            ) : stats?.printOngoing === 0 && stats?.printCompleted === 0 ? (
              <p className="text-center">NA</p>
            ) : (
              <Doughnut options={config.options} data={printStatusData} />
            )}
          </div>
          <div>
            <p className="font-medium">Printing Status</p>
            <div className="flex gap-8 mt-6 flex-wrap">
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-orange-350 rounded-full" />
                <div>
                  <p className="my-2 text-xs font-light text-slate-400">Ongoing</p>
                  <p className="font-bold text-lg">{stats?.printOngoing ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 rounded-full bg-purple-350" />
                <div>
                  <p className="my-2 text-xs font-light text-slate-400">Completed</p>
                  <p className="font-bold text-lg">{stats?.printCompleted ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 p-4 border rounded-md items-center min-h-[200px]">
          <div className="w-32">
            {isStatsLoading ? (
              <Loader className="mx-auto" />
            ) : stats?.mountOngoing === 0 && stats?.mountCompleted === 0 ? (
              <p className="text-center">NA</p>
            ) : (
              <Doughnut options={config.options} data={mountStatusData} />
            )}
          </div>
          <div>
            <p className="font-medium">Mounting Status</p>
            <div className="flex gap-8 mt-6 flex-wrap">
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-orange-350 rounded-full" />
                <div>
                  <p className="my-2 text-xs font-light text-slate-400">Ongoing</p>
                  <p className="font-bold text-lg">{stats?.mountOngoing ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 rounded-full bg-purple-350" />
                <div>
                  <p className="my-2 text-xs font-light text-slate-400">Completed</p>
                  <p className="font-bold text-lg">{stats?.mountCompleted ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCards;
