import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, Image, Loader, Button } from '@mantine/core';
import { useCampaignStats } from '../../../apis/queries/campaigns.queries';
import { Doughnut } from 'react-chartjs-2';
import html2pdf from 'html2pdf.js';
import { Download } from 'react-feather';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
const CampaignCards = () => {
  const isReport = new URLSearchParams(window.location.search).get('share') === 'report';
  const chartRef = useRef(null);
  const config = {
    type: 'line',
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
          top: 10,
          bottom: 15,
          left: 10,
          right: 10,
        },
      },
    },
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
        <p className="font-bold py-4">Campaign stats report</p>
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
        <div className=" p-4 border rounded-md items-center ">
          <p className="font-medium text-center">Printing Status</p>
          <div className="flex gap-4">
            <div className="w-32  mt-6">
              {isStatsLoading ? (
                <Loader className="mx-auto" />
              ) : stats?.printOngoing === 0 && stats?.printCompleted === 0 ? (
                <p className="text-center">NA</p>
              ) : (
                <Doughnut
                  options={config.options}
                  data={printStatusData}
                  ref={chartRef}
                  plugins={[ChartDataLabels, customLinesPlugin]}
                />
              )}
            </div>
            <div>
              <div className="flex gap-8 mt-6 flex-wrap">
                <div className="flex gap-2 items-center">
                  <div className="h-2 w-1 p-2 bg-orange-350 rounded-full" />
                  <div>
                    <p className=" mt-2 text-xs font-light text-slate-400">Ongoing</p>
                    <p className="font-bold text-lg">{stats?.printOngoing ?? 0}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="h-2 w-1 p-2 rounded-full bg-purple-350" />
                  <div>
                    <p className=" text-xs font-light text-slate-400">Completed</p>
                    <p className="font-bold text-lg">{stats?.printCompleted ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=" p-4 border rounded-md items-center ">
        <p className="font-medium text-center">Mounting Status</p>
          <div className="flex gap-4">
          
          <div className="w-32 mt-6">
            {isStatsLoading ? (
              <Loader className="mx-auto" />
            ) : stats?.mountOngoing === 0 && stats?.mountCompleted === 0 ? (
              <p className="text-center">NA</p>
            ) : (
              <Doughnut
                options={config.options}
                data={mountStatusData}
                ref={chartRef}
                plugins={[ChartDataLabels, customLinesPlugin]}
              />
            )}
          </div>
          <div>
            <div className="flex gap-8 mt-6 flex-wrap">
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 bg-orange-350 rounded-full" />
                <div>
                  <p className="mt-2 text-xs font-light text-slate-400">Ongoing</p>
                  <p className="font-bold text-lg">{stats?.mountOngoing ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-1 p-2 rounded-full bg-purple-350" />
                <div>
                  <p className="text-xs font-light text-slate-400">Completed</p>
                  <p className="font-bold text-lg">{stats?.mountCompleted ?? 0}</p>
                </div>
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
