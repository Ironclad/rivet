import { Opaque } from 'type-fest';
import { UserId } from './users';
import { kv } from '@vercel/kv';
import { produce } from 'immer';
import { compare } from 'semver';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { orderBy } from 'lodash-es';

export type RivetTemplateId = Opaque<string, 'RivetGraphId'>;

export type RivetTemplate = {
  id: RivetTemplateId;
  name: string;
  tags: readonly string[];
  author: UserId;
  versions: RivetTemplateVersion[];
};

export type RivetTemplateVersion = {
  descriptionMarkdown: string;
  version: string;
  versionDescriptionMarkdown: string;
  sizeBytes: number;
  createdAt: string;
  numNodes: number;
  plugins: readonly string[];
  blobUrl: string;
  includesCodeNodes: boolean;
  inputs: string[];
  outputs: string[];
  screenshotUrls: string[];
  numGraphs: number;
  graphNames: string[];
  templateParameters: {
    [key: string]: string;
  };
  hasMainGraph: boolean;
  /** Can the template be reduced to a single node and used in other projects? */
  canBeNode: boolean;
};

export type RivetGraphAndStars = RivetTemplate & {
  stars: number;
};

export async function getTemplate(id: RivetTemplateId): Promise<RivetGraphAndStars | null> {
  const [graph, stars] = await Promise.all([kv.get<RivetTemplate>(`graph:${id}`), getStars(id)]);
  return graph ? { ...graph, stars } : null;
}

export async function templateExists(id: RivetTemplateId): Promise<boolean> {
  const count = await kv.exists(`graph:${id}`);
  return count > 0;
}

export async function getTemplateVersion(id: RivetTemplateId, version: string): Promise<RivetTemplateVersion | null> {
  const graph = await getTemplate(id);

  if (!graph) {
    return null;
  }

  const matchingVersion = graph.versions.find((v) => v.version === version);

  if (!matchingVersion) {
    return null;
  }

  return matchingVersion;
}

export async function getAllTemplates(): Promise<RivetGraphAndStars[]> {
  const keys = await kv.keys('graph:*');
  const ids = keys.map((key) => key.split(':')[1] as RivetTemplateId);
  const graphs = await Promise.all(ids.map((id) => getTemplate(id)));

  const validGraphs = graphs.filter((graph): graph is RivetGraphAndStars => !!graph);

  return orderBy(validGraphs, (graph) => graph.stars, 'desc');
}

export async function getTemplatesForUser(userId: UserId): Promise<RivetGraphAndStars[]> {
  const graphs = await getAllTemplates();
  const validGraphs = graphs.filter((graph) => graph.author === userId);

  return orderBy(validGraphs, (graph) => graph.stars, 'desc');
}

export async function getStars(id: RivetTemplateId): Promise<number> {
  const stars = await kv.scard(`graph:${id}:stars`);
  return stars ?? 0;
}

export async function putTemplate(graph: RivetTemplate): Promise<void> {
  await kv.set(`graph:${graph.id}`, graph);
}

export async function putTemplateVersion(templateId: RivetTemplateId, version: RivetTemplateVersion): Promise<void> {
  const graph = await getTemplate(templateId);

  if (!graph) {
    throw new Error(`Graph with id ${templateId} not found`);
  }

  const newGraphs = produce(graph, (draft) => {
    const matchingVersion = draft.versions.find((v) => v.version === version.version);
    if (matchingVersion) {
      graph.versions = graph.versions.filter((v) => v.version !== version.version);
    }
    draft.versions.push({ ...version, plugins: [...version.plugins] });
    draft.versions.sort((a, b) => compare(a.version, b.version));
  });

  await putTemplate(newGraphs);
}

export async function deleteTemplateVersion(templateId: RivetTemplateId, version: string): Promise<void> {
  const graph = await getTemplate(templateId);

  if (!graph) {
    throw new Error(`Graph with id ${templateId} not found`);
  }

  const newGraphs = produce(graph, (draft) => {
    draft.versions = draft.versions.filter((v) => v.version !== version);
  });

  await putTemplate(newGraphs);
}

export async function deleteTemplate(templateId: RivetTemplateId): Promise<void> {
  await kv.del(`graph:${templateId}`);
}

export async function starTemplate(templateId: RivetTemplateId, userId: UserId): Promise<void> {
  await kv.sadd(`graph:${templateId}:stars`, userId);
}

export async function unstarTemplate(templateId: RivetTemplateId, userId: UserId): Promise<void> {
  await kv.srem(`graph:${templateId}:stars`, userId);
}

export async function putTemplateData(data: Uint8Array): Promise<string> {
  const name = `graph-data-${nanoid()}`;
  const { url } = await put(name, data, {
    access: 'public',
  });
  return url;
}

export async function getTemplateData(templateId: RivetTemplateId, version: string): Promise<Uint8Array | null> {
  const graphVersion = await getTemplateVersion(templateId, version);
  if (!graphVersion) {
    return null;
  }

  const data = await fetch(graphVersion.blobUrl);

  if (!data.ok) {
    return null;
  }

  const buffer = await data.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function putScreenshot(data: Uint8Array): Promise<string> {
  const name = `screenshot-${nanoid()}`;
  const { url } = await put(name, data);
  return url;
}
