import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText } from 'lucide-react';

const DATASETS = [
  { id: 'nice-ground-bore',   title: 'NICE Ground Bore',   file: '/data/nice-ground-bore.csv' },
  { id: 'nice-backyard-bore', title: 'NICE Backyard Bore', file: '/data/nice-backyard-bore.csv' },
  { id: 'volleyball-ground',  title: 'Volley Ball Ground',  file: '/data/volleyball-ground.csv' },
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i]; });
    row.Level = parseFloat(row.Level);
    return row;
  });
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [datasets, setDatasets] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const loadAll = async () => {
      const entries = await Promise.all(
        DATASETS.map(async d => {
          const res = await fetch(d.file);
          const text = await res.text();
          return [d.id, parseCSV(text)];
        })
      );
      setDatasets(Object.fromEntries(entries));
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleDownloadCsv = async (file, title) => {
    const res = await fetch(file);
    const text = await res.text();
    downloadBlob(`${title.replace(/\s+/g, '_')}.csv`, text, 'text/csv');
  };

  const handleDownloadAllCsv = async () => {
    const res = await Promise.all(DATASETS.map(d => fetch(d.file).then(r => r.text())));
    const combined = res
      .map((text, i) => `# ${DATASETS[i].title}\n${text}`)
      .join('\n');
    downloadBlob('groundwater_borehole_report.csv', combined, 'text/csv');
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#020617',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('groundwater_borehole_report.pdf');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading report data…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Reports &amp; Data Export</h2>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadAllCsv}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-medium transition-all flex items-center gap-2"
          >
            <Download size={16} /> Download All (CSV)
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileText size={16} /> {generatingPdf ? 'Generating…' : 'Download Report (PDF)'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 bg-slate-950 p-2">
        {DATASETS.map(d => {
          const rows = datasets[d.id] || [];
          return (
            <div
              key={d.id}
              className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">{d.title}</h3>
                <button
                  onClick={() => handleDownloadCsv(d.file, d.title)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Download size={14} /> CSV
                </button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {['Date', 'Event', 'Level (m)'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-slate-400 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        <td className="px-4 py-2 text-slate-300">{r.Date}</td>
                        <td className="px-4 py-2 text-blue-300">{r.Event}</td>
                        <td className="px-4 py-2 text-cyan-400 font-medium">{r.Level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="Date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #164e63', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="Level" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
