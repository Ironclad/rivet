import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { loadedProjectState, projectDataState } from '../state/savedGraphs';
import { useEffect } from 'react';
import { useStaticDataDatabase } from './useStaticDataDatabase';
import { type DataId } from '@ironclad/rivet-core';

export function useLoadStaticData() {
  const [data, setData] = useRecoilState(projectDataState);
  const setProjectData = useSetRecoilState(projectDataState);

  const database = useStaticDataDatabase();

  useEffect(() => {
    if (data) {
      return;
    }

    setData({});

    (async () => {
      const allData = await database.getAll();

      const dataObj = allData.reduce(
        (acc, { id, data }) => {
          acc[id] = data;
          return acc;
        },
        {} as Record<DataId, string>,
      );

      setProjectData((existingData) => ({
        ...existingData,
        ...dataObj,
      }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bleh
  }, [data, setData, setProjectData]);
}
