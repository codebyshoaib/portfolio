"use client";

import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Split content into lines for processing
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: "ul" | "ol" = "ul";

    const processInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;

      // Pattern for **bold** or __bold__
      const boldPattern = /(\*\*|__)(.+?)\1/g;
      // Pattern for *italic* or _italic_
      const italicPattern = /(\*|_)(.+?)\1/g;
      // Pattern for `code`
      const codePattern = /`(.+?)`/g;

      const matches: Array<{
        type: "bold" | "italic" | "code";
        start: number;
        end: number;
        content: string;
      }> = [];

      // Find all matches
      let match;
      while ((match = boldPattern.exec(text)) !== null) {
        matches.push({
          type: "bold",
          start: match.index,
          end: match.index + match[0].length,
          content: match[2],
        });
      }
      while ((match = italicPattern.exec(text)) !== null) {
        // Skip if it's part of a bold match
        const isInBold = matches.some(
          (m) => m.type === "bold" && match.index >= m.start && match.index < m.end,
        );
        if (!isInBold) {
          matches.push({
            type: "italic",
            start: match.index,
            end: match.index + match[0].length,
            content: match[2],
          });
        }
      }
      while ((match = codePattern.exec(text)) !== null) {
        matches.push({
          type: "code",
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
        });
      }

      // Sort matches by position
      matches.sort((a, b) => a.start - b.start);

      // Build parts
      let lastIndex = 0;
      matches.forEach((m) => {
        // Add text before match
        if (m.start > lastIndex) {
          parts.push(text.slice(lastIndex, m.start));
        }

        // Add formatted content
        if (m.type === "bold") {
          parts.push(
            <strong key={`bold-${m.start}`} className="font-semibold">
              {m.content}
            </strong>,
          );
        } else if (m.type === "italic") {
          parts.push(
            <em key={`italic-${m.start}`} className="italic">
              {m.content}
            </em>,
          );
        } else if (m.type === "code") {
          parts.push(
            <code
              key={`code-${m.start}`}
              className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono"
            >
              {m.content}
            </code>,
          );
        }

        lastIndex = m.end;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length > 0 ? parts : [text];
    };

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      // Check for list items
      const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
      const numberMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

      if (bulletMatch || numberMatch) {
        const listItemText = bulletMatch ? bulletMatch[1] : numberMatch![1];
        const newListType = bulletMatch ? "ul" : "ol";

        // If we're starting a new list or changing list type, close previous list
        if (!inList || (inList && listType !== newListType)) {
          if (inList && listItems.length > 0) {
            const ListTag = listType === "ul" ? "ul" : "ol";
            elements.push(
              <ListTag
                key={`list-${lineIndex}`}
                className="list-disc list-inside space-y-1 my-2 ml-4"
              >
                {listItems.map((item, idx) => (
                  <li key={`item-${lineIndex}-${idx}`}>
                    {processInline(item)}
                  </li>
                ))}
              </ListTag>,
            );
            listItems = [];
          }
          inList = true;
          listType = newListType;
        }

        listItems.push(listItemText);
      } else {
        // Not a list item - close any open list first
        if (inList && listItems.length > 0) {
          const ListTag = listType === "ul" ? "ul" : "ol";
          elements.push(
            <ListTag
              key={`list-${lineIndex}`}
              className={`${
                listType === "ul" ? "list-disc" : "list-decimal"
              } list-inside space-y-1 my-2 ml-4`}
            >
              {listItems.map((item, idx) => (
                <li key={`item-${lineIndex}-${idx}`}>
                  {processInline(item)}
                </li>
              ))}
            </ListTag>,
          );
          listItems = [];
          inList = false;
        }

        // Add regular line
        if (trimmedLine) {
          elements.push(
            <p key={`line-${lineIndex}`} className="mb-2 last:mb-0">
              {processInline(trimmedLine)}
            </p>
          );
        } else {
          // Empty line - add spacing
          elements.push(<br key={`br-${lineIndex}`} />);
        }
      }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
      const ListTag = listType === "ul" ? "ul" : "ol";
      elements.push(
        <ListTag
          key="list-final"
          className={`${
            listType === "ul" ? "list-disc" : "list-decimal"
          } list-inside space-y-1 my-2 ml-4`}
        >
          {listItems.map((item, idx) => (
            <li key={`item-final-${idx}`}>{processInline(item)}</li>
          ))}
        </ListTag>,
      );
    }

    return elements.length > 0 ? elements : content;
  }, [content]);

  return <div className={className}>{renderedContent}</div>;
}

