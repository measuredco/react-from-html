import * as React from "react";

export default interface IRehydrator {
  [name: string]: (
    el: Element,
    rehydrate: (element: Element) => React.ReactNode,
    extra: object
  ) => Promise<React.ReactElement<any>>;
}
