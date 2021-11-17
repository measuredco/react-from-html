import * as ReactDOM from "react-dom";

import domElementToReact from "./dom-element-to-react";
import IHydrator from "./IHydrator";
import ILoadedOptions from "./ILoadedOptions";
import IOptions from "./IOptions";

// Global ID
let hydrationId = 1;

// Global list of all items that have already been hydrated
const alreadyHydrated: any = {};

const hydratableToReactElement = async (
  el: Element,
  hydrators: IHydrator,
  options: ILoadedOptions
): Promise<React.ReactElement<any>> => {
  const hydratorSelector = Object.keys(options.allSelectors).find(selector =>
    el.matches(selector)
  );

  if (!hydratorSelector) {
    throw new Error("No hydrator selector matched the element.");
  }

  const hydratorName = options.allSelectors[hydratorSelector];

  if (!hydratorName) {
    throw new Error("Hydrator name is missing from element.");
  }

  const hydrator = hydrators[hydratorName];

  if (!hydrator) {
    throw new Error(`No hydrator found for type ${hydratorName}`);
  }

  const hydrated = await hydrator(
    el,
    async node => {
      await hydrate(node, hydrators, options);
      return domElementToReact(node, async (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;

          // Don't statically hydrate elements that have already been hydrated
          if (el.classList.contains("hydration-root")) {
            return alreadyHydrated[el.getAttribute("data-hydration-id")!];
          }
        }

        return false;
      });
    },
    options.extra
  );

  return hydrated;
};

const createCustomHandler = (
  hydrators: IHydrator,
  options: ILoadedOptions
) => async (node: Node) => {
  // This function will run on _every_ node that domElementToReact encounters.
  // Make sure to keep the conditional highly performant.
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    (node as Element).matches(options.compoundSelector)
  ) {
    return hydratableToReactElement(node as Element, hydrators, options);
  }

  return false;
};

const createReactRoot = (el: Node, id: number) => {
  const container = document.createElement("div");

  if (el.parentNode) {
    el.parentNode.replaceChild(container, el);
  }

  container.appendChild(el);
  container.classList.add("hydration-root");
  container.setAttribute("data-hydration-id", `${id}`);

  return container;
};

const hydrateChildren = async (
  el: Node,
  hydrators: IHydrator,
  options: ILoadedOptions
) => {
  const id = hydrationId++;
  const container = createReactRoot(el, id);

  const hydrated = await domElementToReact(
    container,
    createCustomHandler(hydrators, options)
  );

  alreadyHydrated[id] = hydrated;

  return {
    container,
    hydrated,
  };
};

const render = ({
  hydrated,
  root,
}: {
  hydrated?: React.ReactNode;
  root?: Element;
}) => {
  if (!hydrated || !root) {
    return;
  }

  // Unmount; it's possible that this was hydrated previously.
  ReactDOM.unmountComponentAtNode(root);

  ReactDOM.render(hydrated as React.ReactElement<any>, root);
};

const defaultGetQuerySelector = (key: string) => key;

const createQuerySelectors = (
  hydratableIds: string[],
  getQuerySelector: ((key: string) => string) = defaultGetQuerySelector
) => {
  const allSelectors: { [key: string]: string } = hydratableIds.reduce(
    (acc, key) => ({ ...acc, [getQuerySelector(key)]: key }),
    {}
  );

  const compoundSelector = Object.keys(allSelectors).reduce(
    (acc: string, selector: string) => `${acc ? `${acc}, ` : ""}${selector}`,
    ""
  );

  return {
    allSelectors,
    compoundSelector,
  };
};

const hydrate = async (
  container: Element,
  hydrators: IHydrator,
  options: IOptions = {}
) => {
  const { allSelectors, compoundSelector } = createQuerySelectors(
    Object.keys(hydrators),
    options.getQuerySelector || defaultGetQuerySelector
  );

  const loadedOptions: ILoadedOptions = {
    allSelectors,
    compoundSelector,
    extra: options.extra || {},
  };

  const roots = Array.from(container.querySelectorAll(compoundSelector)).reduce(
    (acc: Element[], root: Element) => {
      // filter roots that are contained within other roots
      if (!acc.some(r => r.contains(root))) {
        acc.push(root);
      }
      return acc;
    },
    []
  );

  // TODO: solve race condition when a second hydrate runs

  const renders = [];

  for (const root of roots) {
    // It's possible that this root was detached by a previous render in this loop
    if (container.contains(root)) {
      renders.push(async () => {
        try {
          const { container: rootContainer, hydrated } = await hydrateChildren(
            root,
            hydrators,
            loadedOptions
          );

          return { root: rootContainer, hydrated };
        } catch (e) {
          /* tslint:disable-next-line no-console */
          console.error("Hydration failure", e);
        }

        return {};
      });
    }
  }

  await Promise.all(renders.map(r => r().then(render)));
};

export default hydrate;

export { IHydrator, hydratableToReactElement };
