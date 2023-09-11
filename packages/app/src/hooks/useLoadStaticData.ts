import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { loadedProjectState, projectDataState } from '../state/savedGraphs';
import { useEffect } from 'react';
import { useLoadProject } from './useLoadProject';
import { useStaticDataDatabase } from './useStaticDataDatabase';
import { DataId } from '@ironclad/rivet-core';

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

      const dataObj = allData.reduce((acc, { id, data }) => {
        acc[id] = data;
        return acc;
      }, {} as Record<DataId, unknown>);

      setProjectData((existingData) => ({
        ...existingData,
        ...dataObj,
      }));
    })();
  }, [data]);
}
