import { object, string, bool, mixed, array, type CheckerReturnType, number, dict } from '@recoiljs/refine';

export const getProfileResponseChecker = object({
  user: object({
    id: string(),
    username: string(),
    email: string(),
    displayName: string(),
  }),
});

export type PutProfileBody = {
  username: string;
  displayName: string;
  email: string;
};

const postTemplateBodyChecker = object({
  name: string(),
  tags: array(string()),
});

export type PostTemplateBody = CheckerReturnType<typeof postTemplateBodyChecker>;

export const putTemplateVersionBodyChecker = object({
  descriptionMarkdown: string(),
  versionDescriptionMarkdown: string(),
  plugins: array(string()),
  serializedProject: string(),
});

export type PutTemplateVersionBody = CheckerReturnType<typeof putTemplateVersionBodyChecker>;

export const templateVersionChecker = object({
  descriptionMarkdown: string(),
  version: string(),
  versionDescriptionMarkdown: string(),
  sizeBytes: number(),
  createdAt: string(),
  numNodes: number(),
  plugins: array(string()),
  blobUrl: string(),
  includesCodeNodes: bool(),
  inputs: array(string()),
  outputs: array(string()),
  screenshotUrls: array(string()),
  numGraphs: number(),
  graphNames: array(string()),
  templateParameters: dict(string()),
  hasMainGraph: bool(),
  canBeNode: bool(),
});

export type TemplateVersion = CheckerReturnType<typeof templateVersionChecker>;

export const templateResponseChecker = object({
  id: string(),
  name: string(),
  author: string(),
  tags: array(string()),
  versions: array(templateVersionChecker),
  stars: number(),
});

export type TemplateResponse = CheckerReturnType<typeof templateResponseChecker>;

export const unpublishTemplateResponseChecker = object({
  success: bool(),
});
