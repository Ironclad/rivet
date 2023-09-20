import { DatasetRow, newId } from '@ironclad/rivet-core';
import { FC, useState } from 'react';
import { LazyCodeEditor } from '../LazyComponents';

export const DatasetTable: FC<{
  datasetData: DatasetRow[];
  onDataChanged: (data: DatasetRow[]) => void;
}> = ({ datasetData, onDataChanged }) => {
  return (
    <div className="dataset-table-container">
      <table className="dataset-table">
        <tbody>
          {datasetData.map((row, i) => (
            <tr key={i}>
              {row.data.map((cell, j) => (
                <td key={`${i}-${j}`}>
                  <DatasetEditableCell
                    value={cell}
                    row={i}
                    column={j}
                    onChange={(value) => {
                      const newData = [...datasetData];
                      newData[i]!.data[j] = value;
                      onDataChanged(newData);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="add-column-area">
        <button
          onClick={() => {
            const newData = [...datasetData];
            newData.forEach((row) => row.data.push(''));
            onDataChanged(newData);
          }}
        >
          Add New Column
        </button>
      </div>
      <div className="add-row-area">
        <button
          onClick={() => {
            const newData = [...datasetData];
            newData.push({
              id: newId(),
              data: Array(datasetData[0]?.data.length ?? 1).fill(''),
            });
            onDataChanged(newData);
          }}
        >
          Add New Row
        </button>
      </div>
    </div>
  );
};

const DatasetEditableCell: FC<{
  value: string;
  row: number;
  column: number;
  onChange: (value: string) => void;
}> = ({ value, row, column, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [editingText, setEditingText] = useState(value);

  return (
    <div className="cell editor" data-row={row} data-column={column} data-contextmenutype="cell">
      {editing ? (
        <LazyCodeEditor
          autoFocus
          text={value}
          onChange={(e) => setEditingText(e)}
          onBlur={() => {
            onChange(editingText);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.keyCode === 3 && (e.metaKey || e.ctrlKey)) {
              onChange((e.target as HTMLInputElement).value);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className="value" onDoubleClick={() => setEditing(true)}>
          {value}
        </div>
      )}
    </div>
  );
};
