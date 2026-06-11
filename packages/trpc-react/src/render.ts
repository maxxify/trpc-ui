import type { TrpcPanelExtraOptions } from "trpc-parser";

export type Info = {
  title?: string;
  description?: string;
};

export type RenderOptions = {
  url: string;
  cache?: boolean;
  meta?: Info;
} & TrpcPanelExtraOptions;
