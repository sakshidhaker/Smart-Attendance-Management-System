import EmptyState from "./EmptyState";

/*
  Reusable table.
  columns: [{ key, header, render?(row) }]
  rows: data array
*/
export default function DataTable({ columns, rows, rowKey = "_id", emptyTitle, emptyText }) {
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} text={emptyText} />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={typeof rowKey === "function" ? rowKey(row) : row[rowKey] ?? i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
