"use client";

import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, type ReactNode } from "react";
import { cx, inputClass } from "./ui";

/**
 * WYSIWYG editor limited to what the email renderer supports: headings
 * (H2/H3), bold/italic/underline/strike, lists, quotes, links, images and
 * dividers. Emits HTML; the API sanitises it again on save.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["mailto"] },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Write your message… Use {{name}} for the reader's first name." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    editorProps: { attributes: { class: "email-prose min-h-[320px] px-5 py-4 outline-none", "aria-label": "Message" } },
  });

  return (
    <div className={cx("rounded-xl border border-line bg-card focus-within:border-moss focus-within:ring-2 focus-within:ring-moss/15", disabled && "opacity-70")}>
      {editor && !disabled && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when these flags change, not on every keystroke.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [panel, setPanel] = useState<"link" | "image" | null>(null);
  const chain = () => editor.chain().focus();

  return (
    // Sticks under the editor page header so it stays reachable in long messages.
    <div className="sticky top-[78px] z-10 rounded-t-xl border-b border-line-soft bg-[#f8f8f1]">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <Tool label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <b>B</b>
        </Tool>
        <Tool label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <i className="font-serif-italic">I</i>
        </Tool>
        <Tool label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <span className="underline">U</span>
        </Tool>
        <Tool label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <span className="line-through">S</span>
        </Tool>
        <Sep />
        <Tool label="Heading" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          H2
        </Tool>
        <Tool label="Subheading" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          H3
        </Tool>
        <Sep />
        <Tool label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          • List
        </Tool>
        <Tool label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          1. List
        </Tool>
        <Tool label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
          “ ”
        </Tool>
        <Sep />
        <Tool label="Link" active={s.link || panel === "link"} onClick={() => setPanel(panel === "link" ? null : "link")}>
          Link
        </Tool>
        <Tool label="Image" active={panel === "image"} onClick={() => setPanel(panel === "image" ? null : "image")}>
          Image
        </Tool>
        <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()}>
          ―
        </Tool>
        <Tool label="Insert the reader's first name" onClick={() => chain().insertContent("{{name}}").run()}>
          {"{{name}}"}
        </Tool>
        <span className="ml-auto flex gap-0.5">
          <Tool label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
            ↶
          </Tool>
          <Tool label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
            ↷
          </Tool>
        </span>
      </div>

      {panel === "link" && (
        <UrlBar
          key={`link-${s.href}`}
          placeholder="https://gettheround.com/…"
          initial={s.href}
          submitLabel={s.link ? "Update link" : "Add link"}
          onSubmit={(url) => {
            if (url) chain().extendMarkRange("link").setLink({ href: url }).run();
            setPanel(null);
          }}
          extra={
            s.link ? (
              <button type="button" onClick={() => (chain().extendMarkRange("link").unsetLink().run(), setPanel(null))} className="text-xs font-bold text-danger">
                Remove link
              </button>
            ) : null
          }
          hint="Select text first, or the link is added at the cursor."
        />
      )}
      {panel === "image" && (
        <UrlBar
          key="image"
          placeholder="https://…/image.png"
          initial=""
          submitLabel="Insert image"
          httpsOnly
          onSubmit={(url) => {
            if (url) chain().setImage({ src: url }).run();
            setPanel(null);
          }}
          hint="Use a public https:// image URL. Email clients can't show local files."
        />
      )}
    </div>
  );
}

function UrlBar({
  placeholder,
  initial,
  submitLabel,
  onSubmit,
  extra,
  hint,
  httpsOnly,
}: {
  placeholder: string;
  initial: string;
  submitLabel: string;
  onSubmit: (url: string) => void;
  extra?: ReactNode;
  hint: string;
  httpsOnly?: boolean;
}) {
  const [url, setUrl] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const v = url.trim();
    if (!v) return onSubmit("");
    const ok = httpsOnly ? /^https:\/\/\S+$/.test(v) : /^(https?:\/\/|mailto:)\S+$/.test(v);
    if (!ok) return setError(httpsOnly ? "Must start with https://" : "Must start with https://, http:// or mailto:");
    onSubmit(v);
  };
  return (
    <div className="border-t border-line-soft px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={url}
          onChange={(e) => (setUrl(e.target.value), setError(null))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
          placeholder={placeholder}
          className={cx(inputClass, "h-8 max-w-md flex-1")}
        />
        <button type="button" onClick={submit} className="h-8 rounded-lg bg-ink px-3 text-xs font-bold text-cream">
          {submitLabel}
        </button>
        {extra}
      </div>
      <p className={cx("mt-1 text-[11px]", error ? "text-danger" : "text-muted")}>{error ?? hint}</p>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "h-8 min-w-8 rounded-md px-2 text-xs font-bold transition-colors disabled:opacity-30",
        active ? "bg-ink text-cream" : "text-ink hover:bg-line-soft",
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span aria-hidden className="mx-1 h-5 w-px bg-line" />;
