# react-from-html

> Convert HTML into React components

## Intro

`react-from-html` allows you to convert _individual_ DOM nodes into React components. This means you can use React components in non-React contexts.

You can go from this:

```html
<div class="ShowMore" data-content="Hello, World!"></div>
```

to this:

```jsx
<ShowMore content="Hello, World!" />
```

## Quick Start

Install

```sh
npm install --save react-from-html
```

Map your selectors to your components

```jsx
import React from "react";
import reactFromHTML from "react-from-html";

// Your component
const ShowMore = ({ content }) => (
  <div className="ShowMore" data-content={content} />
);

// Can be anywhere on page. You can also have multiple entry points.
const root = document.querySelector("body");

reactFromHTML(root, {
  // Map all `.ShowMore` elements using a rehydrator function
  ".ShowMore": async el => <ShowMore content={el.dataset.content} />,
});
```

## API

### `reactFromHTML(root, rehydrators, options)`

Params:

- **root**: Element - Root element containing your components
- **rehydrators**: Object - mapping functions
  - **key**: String - The query selector for the component
  - **value**: Func - A **Rehydrator Function**, describing how to map this element to a React component (see below).
- **Options**: Object
  - **extra**: Object - additional properties passed to each rehydrator functions
  - **getQuerySelector**: (key:String): String - a function for defining custom query selectors for each key

### `rehydrator(el, rehydrate, extra): ReactNode`

Defined by you for each component you want to convert back into React. It maps an `Element` into a `ReactNode`.

- **el**: Element - the element for this component, as defined by the query selector
- **rehydrate(el)**: Func - a convenience, prebaked version of `reactFromHTML` used for rehydrating child nodes. For example, converting `innerHTML` into React children.
- **extra**: Object - additional params as defined in the initial `reactFromHTML()` call.

## Examples

### Basic rehydration

This example shows rehydration of a basic component, with the single prop `content` that is assigned to a data attribute.

#### React

```jsx
const ShowMore = ({ content }) => (
  <div className="ShowMore" data-content={content} />
);

// <ShowMore content="Hello, World" />
```

#### HTML

```html
<body>
  <div class="ShowMore" data-content="Hello, World"></div>
</body>
```

#### Rehydration

```jsx
reactFromHTML(document.querySelector("body"), {
  ".ShowMore": async el => <ShowMore content={el.dataset.content} />,
});
```

### Advanced rehydration

This example shows rehydration of a more complex component, with multiple props, and children which may themselves need rehydrating.

#### React

```jsx
const Modal = ({ children }) => (
  <div className="Modal">
    <div class="Modal-title">{title}</div>
    <div class="Modal-inner">{children}</div>
  </div>
);

const ShowMore = ({ content }) => (
  <div className="ShowMore" data-content={content} />
);

// <Modal title="My Modal">
//   <ShowMore content="Hello, World">
// </Modal>
```

#### HTML

```html
<body>
  <div class="Modal">
    <div class="Modal-title">My Modal</div>
    <div class="Modal-inner">
      <div class="ShowMore" data-content="Hello, World"></div>
    </div>
  </div>
</body>
```

#### Rehydration

```jsx
const ModalRehydrator = async (el, rehydrate) => (
  <Modal title={el.querySelector(".Modal-title").innerHTML}>
    {rehydrate(el.querySelector(".Modal-inner"))}
  </Modal>
);

const ShowMoreRehydrator = async el => (
  <ShowMore content={el.dataset.content} />
);

reactFromHTML(document.querySelector("body"), {
  ".Modal": ModalRehydrator,
  ".ShowMore": ShowMoreRehydrator,
});
```

## Acknowledgement

This package is based on the excellent [react-from-markup](https://github.com/simon360/react-from-markup) from [Simon Andrews](https://github.com/simon360).

## LICENSE

MIT
