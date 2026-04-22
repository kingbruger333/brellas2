type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  text?: string;
};

export function SectionTitle({ eyebrow, title, text }: SectionTitleProps) {
  return (
    <div className="sectionTitle">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}
