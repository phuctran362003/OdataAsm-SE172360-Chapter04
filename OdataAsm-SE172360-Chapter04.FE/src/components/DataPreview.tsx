import React from 'react';
import type { CovidRecord } from '../types/covid';
import './DataPreview.css';

interface Props {
  rows: CovidRecord[];
  title?: string;
}

export const DataPreview: React.FC<Props> = ({ rows, title = 'Top 50 records' }) => {
  if (!rows.length) return null;

  return (
    <div className="preview">
      <div className="preview-header">{title}</div>
      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Country</th>
              <th>Province</th>
              <th>Date</th>
              <th>Value</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td>{i + 1}</td>
                <td>{r.country}</td>
                <td>{r.province}</td>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.value}</td>
                <td style={{ textAlign: 'right' }}>{r.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};