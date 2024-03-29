/* eslint-env jest */
import * as React from "react";
import reactFromHtml from "..";
import type IHydrator from "../IHydrator";

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

  it("Should not re-hydrate already hydrated components on multiple `reactFromHtml()` calls", async () => {
    const componentName: string = "myComponent";

    const mockCall = jest.fn();
    const hydrator = async () => {
      mockCall();

      return React.createElement("span", {}, "hydrated component");
    };

    const hydrators = { [`.${componentName}`]: hydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `<div class="${componentName}"></div>`;

    await reactFromHtml(documentElement, hydrators);
    await reactFromHtml(documentElement, hydrators);
    expect(mockCall).toBeCalledTimes(1);
  });

  it("Should work for nested hydratables", async () => {
    const mockCall = jest.fn();
    const hydrators: IHydrator = {
      [`.Parent`]: async (el: Element, hydrate) => {
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

  it("Should not mutate static markup", async () => {
    const componentName: string = "myComponent";

    const hydrator = async () => {
      return React.createElement("span", {}, "hydrated component");
    };

    const hydrators = { [`.${componentName}`]: hydrator };
    const documentElement = document.createElement("div");

    documentElement.innerHTML = `
    <div>
      <p>Static HTML, with some <b style="font-weight:bold;">interesting</b> markup</p>
      <div data-hydratable="test-${componentName}"></div>
    </div>`;

    await reactFromHtml(documentElement, hydrators);

    expect(documentElement.innerHTML).toMatchSnapshot();
  });

  it("Should not mutate static markup of nested children", async () => {
    const mockCall = jest.fn();
    const hydrators: IHydrator = {
      [`.Parent`]: async (el: Element, hydrate) => {
        mockCall();

        return React.createElement("span", {}, await hydrate(el));
      },
    };

    const documentElement = document.createElement("div");

    documentElement.innerHTML = `
      <div class="Parent">
        <p>Static HTML, with some <b style="font-weight:bold;">interesting</b> markup</p>
        <form>
          <input type="checkbox" name="confirm" value="confirmed" checked>
          <select id="favourite-color">
            <option value="red">red</option>
            <option value="green" selected>green</option>
            <option value="blue">blue</option>
          </select>
          <textarea name="message">Default value</textarea>
        </form>
      </div>
      `;

    await reactFromHtml(documentElement, hydrators);

    expect(documentElement.innerHTML).toMatchSnapshot();
    expect(mockCall).toBeCalledTimes(1);
  });
});
