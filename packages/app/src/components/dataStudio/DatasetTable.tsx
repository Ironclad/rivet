import { type DatasetRow, newId } from '@ironclad/rivet-core';
import { type FC, useState, useEffect, Suspense } from 'react';
import { LazyCodeEditor } from '../LazyComponents';
import { css } from '@emotion/react';
import ImageInPictureIcon from 'majesticons/line/image-in-picture-line.svg?react';
import { type DatasetRowWithDistance } from './DatasetDisplay';

const styles = css`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-auto-rows: auto;

  .add-column-area {
    min-height: 100px;
    width: 48px;

    button {
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;

      span {
        transform: rotate(90deg);
      }

      &:hover {
        background-color: var(--grey-darkerish);
      }
    }
  }

  .add-row-area {
    min-height: 48px;

    button {
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;

      &:hover {
        background-color: var(--grey-darkerish);
      }
    }
  }

  .dataset-table {
    width: 100%;
    table-layout: auto;

    tbody {
      border: none;
    }

    td {
      border: 1px solid var(--grey);
      padding: 0;
      margin: 0;
      min-width: 200px;
      vertical-align: top;

      .cell {
        height: 48px;

        &.editor {
          .editor-container {
            min-height: 200px;
            min-width: 100px;
          }
        }
      }

      .value {
        padding: 4px 8px;
        height: 100%;
        display: flex;
        align-items: flex-start;
        overflow: hidden;
      }
    }

    td.id-cell {
      width: 50px;
      min-width: 0;
      overflow: hidden;
    }

    td.idx-cell {
      width: 48px;
      min-width: 0;
    }

    td.embedding-cell {
      width: 32px;
      min-width: 0;
      display: flex;
      height: 48px;

      span {
        display: inline-flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
      }
      svg {
        width: 24px;
        height: 24px;
      }
    }

    td.distance-cell {
      width: 32px;
      min-width: 0;
    }

    td.idx-cell,
    td.id-cell,
    td.embedding-cell,
    td.distance-cell {
      color: var(--foreground-muted);
      border: 0;

      vertical-align: middle;

      .value {
        align-items: center;
      }
    }
  }
`;

export const DatasetTable: FC<{
  datasetData: DatasetRowWithDistance[];
  isFiltered?: boolean;
  onDataChanged: (data: DatasetRow[]) => void;
}> = ({ datasetData, isFiltered, onDataChanged }) => {
  const getColorForDistance = (distance: number) => {
    const points = [
      [0, [255, 0, 0]],
      [0.5, [255, 0, 0]],
      [0.75, [255, 255, 0]],
      [1, [0, 255, 0]],
    ] as const;

    distance = Math.min(Math.max(distance, 0), 1);

    // Find the two points between which the input lies
    let i = 0;
    while (i < points.length) {
      if (distance < points[i]![0]!) {
        i--;
        break;
      }
      i++;
    }

    // Linearly interpolate the colors
    const [t1, color1] = points[i]!;
    const [t2, color2] = points[i + 1]!;
    const ratio = (distance - t1) / (t2 - t1);
    const [r, g, b] = color1.map((c1, i) => c1 + ratio * (color2[i]! - c1)) as [number, number, number];

    return `rgb(${r},${g},${b})`;
  };

  return (
    <div css={styles} className="dataset-table-container">
      <table className="dataset-table">
        <tbody>
          {datasetData.map((row, i) => (
            <tr key={i}>
              <td key={`${i}-idx`} className="idx-cell">
                {i + 1}
              </td>
              <td key={`${i}-embedding`} className="embedding-cell">
                {datasetData[i]!.embedding ? (
                  <span title="Has Embedding">
                    <ImageInPictureIcon />
                  </span>
                ) : null}
              </td>
              {row.distance != null && (
                <td
                  key={`${i}-distance`}
                  className="distance-cell"
                  style={{ color: getColorForDistance(row.distance) }}
                >
                  {row.distance.toFixed(2)}
                </td>
              )}
              <td key={`${i}-id`} className="id-cell">
                <DatasetEditableCell
                  value={row.id}
                  row={i}
                  column={-1}
                  onChange={(value) => {
                    const newData = [...datasetData];
                    newData[i]!.id = value;
                    onDataChanged(newData);
                  }}
                />
              </td>

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
      {!isFiltered && (
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
      )}
      {!isFiltered && (
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
      )}
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
        <Suspense fallback={<div />}>
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
                onChange(editingText);
                setEditing(false);
              }
            }}
          />
        </Suspense>
      ) : (
        <div className="value" onDoubleClick={() => setEditing(true)}>
          {value}
        </div>
      )}
    </div>
  );
};
