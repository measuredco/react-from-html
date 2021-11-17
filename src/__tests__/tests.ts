/* eslint-env jest */
import * as React from "react";
import reactFromHtml from "..";

describe("reactFromHtml E2E tests", async () => {
  it("Should hydrate a basic component", async () => {
    const componentName: string = "myComponent";

    const hydrator = async () => {
      return React.createElement("span", {}, "hydrated component");
    };

    const hydrators = { [`.${componentName}`]: hydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `<div class="${componentName}"></div>`;

    await reactFromHtml(documentElement, hydrators);

    expect(documentElement.innerHTML).toMatchSnapshot();
  });

  it("Should work for nested hydratables", async () => {
    const mockCall = jest.fn();
    const hydrators = {
      [`.Parent`]: async (el, hydrate) => {
        mockCall();

        return React.createElement("span", {}, await hydrate(el));
      },
      [`.Child`]: async (el, hydrate) => {
        mockCall();

        return React.createElement("b", {}, await hydrate(el));
      },
    };

    const documentElement = document.createElement("div");

    documentElement.innerHTML = `
      <div class="Parent">
        <div class="Child">
          Hello, World!
        </div>
      </div>
      `;

    await reactFromHtml(documentElement, hydrators);

    expect(documentElement.innerHTML).toMatchSnapshot();
    expect(mockCall).toBeCalledTimes(2);
  });

  it("Should hydrate components with custom query selectors", async () => {
    const componentName: string = "myComponent";

    const hydrator = async () => {
      return React.createElement("span", {}, "hydrated component");
    };

    const hydrators = { [componentName]: hydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `<div data-hydratable="test-${componentName}"></div>`;

    await reactFromHtml(documentElement, hydrators, {
      extra: {},
      getQuerySelector: key => `[data-hydratable*="${key}"]`,
    });

    expect(documentElement.innerHTML).toMatchSnapshot();
  });
});
