import React from 'react';

export default function DataTable({ caption, headings, rows, numeric = false, highlightColumn = headings.length - 1 }) {
  return <div className="technology-table-scroll" role="region" aria-label={caption} tabIndex={0}>
    <table className={numeric ? 'technology-table numeric' : 'technology-table'}>
      <caption>{caption}</caption>
      <thead><tr>{headings.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(([label, ...cells]) => <tr key={label}><th scope="row">{label}</th>{cells.map((cell, i) => <td key={i} className={numeric && i + 1 === highlightColumn ? 'is-selected' : undefined}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
