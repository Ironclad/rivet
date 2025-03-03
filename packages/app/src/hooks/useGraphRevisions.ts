import { useAtomValue } from 'jotai';
import { loadedProjectState } from '../state/savedGraphs';
import { Command } from '@tauri-apps/api/shell';
import useAsyncEffect from 'use-async-effect';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deserializeProject, type GraphId, serializeGraph, type Project } from '@ironclad/rivet-core';
import { graphState } from '../state/graph';
import isEqual from 'fast-deep-equal';
import { type CalculatedRevision, ProjectRevisionCalculator } from '../utils/ProjectRevisionCalculator';

const revisionCalculators = new Map<string, ProjectRevisionCalculator>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useProjectRevisions(options?: { max?: number }) {
  const projectState = useAtomValue(loadedProjectState);
  const [isLoading, setIsLoading] = useState(true);

  const [revisions, setRevisions] = useState<CalculatedRevision[]>([]);

  const [numTotalRevisions, setNumTotalRevisions] = useState(0);
  const [numProcessedRevisions, setNumProcessedRevisions] = useState(0);

  useEffect(() => {
    if (!projectState.path) {
      return;
    }

    let calculator = revisionCalculators.get(projectState.path);
    if (!calculator) {
      calculator = new ProjectRevisionCalculator(projectState.path);
      revisionCalculators.set(projectState.path, calculator);
    }

    if (!calculator.isRunning()) {
      calculator.startProcessingRevisions();
    }

    const onProcessed = () => {
      setRevisions(calculator!.processedRevisions);
      setNumProcessedRevisions(calculator!.processedRevisions.length);
      setNumTotalRevisions(calculator!.numTotalRevisions);
    };

    const onFinished = () => {
      setIsLoading(false);
    };

    calculator.on('processed', onProcessed);
    calculator.on('finished', onFinished);

    return () => {
      calculator!.off('processed', onProcessed);
      calculator!.off('finished', onFinished);
    };
  }, [projectState.path]);

  const stop = useCallback(() => {
    if (!projectState.path) {
      return;
    }

    const calculator = revisionCalculators.get(projectState.path);
    if (calculator) {
      calculator.abortProcessing();
    }
    setIsLoading(false);
  }, [projectState.path]);

  const resume = useCallback(() => {
    if (!projectState.path) {
      return;
    }

    const calculator = revisionCalculators.get(projectState.path);
    if (calculator) {
      calculator.startProcessingRevisions();
      setRevisions(calculator.processedRevisions);
      setNumProcessedRevisions(calculator.processedRevisions.length);
      setNumTotalRevisions(calculator.numTotalRevisions);
    }
    setIsLoading(true);
  }, [projectState.path]);

  return { revisions, isLoading, stop, numTotalRevisions, numProcessedRevisions, resume };
}

export function useGraphRevisions(options?: { max?: number }) {
  const { revisions, isLoading, stop, numTotalRevisions, numProcessedRevisions, resume } = useProjectRevisions(options);

  const graph = useAtomValue(graphState);

  if (!graph) {
    return {
      revisions: [],
      isLoading,
      stop,
      numTotalRevisions,
      numProcessedRevisions,
      resume,
    };
  }

  return {
    revisions: revisions.filter((revision) => revision.changedGraphs.includes(graph.metadata!.id!)),
    isLoading,
    stop,
    numTotalRevisions,
    numProcessedRevisions,
    resume,
  };
}

export function useHasGitHistory() {
  const projectPath = useAtomValue(loadedProjectState).path;

  const [hasHistory, setHasHistory] = useState(false);

  useAsyncEffect(async () => {
    if (!projectPath) {
      return;
    }

    const pathDirname = projectPath.split('/').slice(0, -1).join('/');

    const result = await new Command('git', ['rev-list', '--count', 'HEAD'], {
      cwd: pathDirname,
    }).execute();

    if (result.code === 0) {
      setHasHistory(true);
    }
  }, [projectPath]);

  return hasHistory;
}
