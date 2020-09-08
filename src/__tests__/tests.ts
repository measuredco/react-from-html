/* eslint-env jest */
import * as React from "react";
import reactFromHtml from "..";

describe("reactFromHtml E2E tests", async () => {
  it("Should rehydrate a basic component", async () => {
    const componentName: string = "myComponent";

    const rehydrator = async () => {
      return React.createElement("span", {}, "rehydrated component");
    };

    const rehydrators = { [componentName]: rehydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `<div data-rehydratable="${componentName}"></div>`;

    await reactFromHtml(documentElement, rehydrators, {
      extra: {},
    });

    expect(documentElement.innerHTML).toMatchSnapshot();
  });

  it("Should work for nested rehydratables", async () => {
    const componentName: string = "mycomponentName";

    const mockCall = jest.fn();
    const rehydrators = {
      [componentName]: async (el, rehydrate) => {
        mockCall();

        return React.createElement("span", {}, await rehydrate(el));
      },
    };

    const documentElement = document.createElement("div");

    documentElement.innerHTML = `
      <div data-rehydratable="${componentName}">
        <div data-rehydratable="${componentName}">
          Hello, World!
        </div>
      </div>
      `;

    await reactFromHtml(documentElement, rehydrators, {
      extra: {},
    });

    expect(documentElement.innerHTML).toMatchSnapshot();
    expect(mockCall).toBeCalledTimes(2);
  });

  it("Should rehydrate components with custom query selectors", async () => {
    const componentName: string = "myComponent";

    const rehydrator = async () => {
      return React.createElement("span", {}, "rehydrated component");
    };

    const rehydrators = { [componentName]: rehydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `<div class="test-${componentName}"></div>`;

    await reactFromHtml(documentElement, rehydrators, {
      extra: {},
      getQuerySelector: key => `.test-${key}`,
    });

    expect(documentElement.innerHTML).toMatchSnapshot();
  });
});
