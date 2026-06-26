import { PageHeader } from "./PageHeader";

/**
 * ScreenPlaceholder — 스캐폴딩용 임시 화면 컴포넌트.
 *
 * 이번 단계(라우팅/구조/레이아웃)에서 각 라우트가 동작함을 보여주기 위한 자리표시자다.
 * 실제 화면 구현 시 이 컴포넌트는 명세서 §10의 각 화면 컴포넌트로 교체된다.
 */
export function ScreenPlaceholder({
  title,
  subtitle,
  route,
  description,
  todo,
}: {
  title: string;
  subtitle?: string;
  route: string;
  description?: string;
  /** 추후 이 화면에서 구현할 항목 (명세서 기준) */
  todo?: string[];
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <section className="flex flex-1 flex-col gap-5 px-5 py-6">
        <span className="w-fit rounded-full bg-primary-soft px-3 py-1 font-mono text-xs font-medium text-primary">
          {route}
        </span>

        {description ? (
          <p className="text-sm leading-6 text-neutral">{description}</p>
        ) : null}

        <div className="rounded-2xl border border-dashed border-border bg-surface p-5">
          <p className="text-sm font-semibold text-foreground">
            화면 준비 중 (placeholder)
          </p>
          {todo && todo.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {todo.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-6 text-neutral"
                >
                  <span aria-hidden className="text-primary">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </>
  );
}
