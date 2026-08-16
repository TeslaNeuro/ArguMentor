"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BR_TAG = /<br\s*\/?>/gi;

function splitHtmlBreaks(text: string): ReactNode {
  const parts = text.split(BR_TAG);
  if (parts.length === 1) return text;

  return parts.flatMap((part, index) =>
    index === 0 ? [part] : [<br key={`br-${index}`} />, part],
  );
}

/** LLMs often emit HTML `<br>` inside Markdown; react-markdown leaves it as text. */
function renderWithHtmlBreaks(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") return splitHtmlBreaks(child);
    if (!isValidElement(child)) return child;

    const element = child as ReactElement<{ children?: ReactNode }>;
    if (element.props.children == null) return child;

    return cloneElement(element, {
      ...element.props,
      children: renderWithHtmlBreaks(element.props.children),
    });
  });
}

export function Markdown({
  content,
  inline = false,
}: {
  content: string;
  inline?: boolean;
}) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={inline ? "markdown markdown-inline" : "markdown"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) =>
            inline ? (
              <span>{renderWithHtmlBreaks(children)}</span>
            ) : (
              <p>{renderWithHtmlBreaks(children)}</p>
            ),
          li: ({ children }) => <li>{renderWithHtmlBreaks(children)}</li>,
          td: ({ children }) => <td>{renderWithHtmlBreaks(children)}</td>,
          th: ({ children }) => <th>{renderWithHtmlBreaks(children)}</th>,
        }}
      >
        {content}
      </ReactMarkdown>
    </Wrapper>
  );
}
