import { createContext, useContext } from "react";

export type BootstrapData = {
  portfolio: Array<any>;
  posts: Array<any>;
  feed: Array<any>;
  docs: Array<any>;
  tickets: Array<any>;
};

const BootstrapContext = createContext<BootstrapData>({ portfolio: [], posts: [], feed: [], docs: [], tickets: [] });
export const BootstrapProvider = BootstrapContext.Provider;
export const useBootstrap = () => useContext(BootstrapContext);
