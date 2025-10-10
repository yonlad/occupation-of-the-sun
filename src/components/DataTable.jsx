import { useEffect, useState } from 'react'
import Papa from 'papaparse'

export default function DataTable({ csvUrl }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    if (!csvUrl) return
    Papa.parse(csvUrl, { download: true, header: true, complete: r => setRows(r.data) })
  }, [csvUrl])
  if (!rows?.length) return <div>Loading…</div>
  const headers = Object.keys(rows[0])
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 8px' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {headers.map(h => (
              <td key={h} style={{ borderBottom: '1px solid #eee', padding: '6px 8px' }}>{r[h]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}



