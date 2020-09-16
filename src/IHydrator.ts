import * as React from "react";

export default interface IHydrator {
  [name: string]: (
    el: Element,
    hydrate: (element: Element) => React.ReactNode,
    extra: object
  ) => Promise<React.ReactElement<any>>;
}
