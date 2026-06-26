/**
 * FormHelperText — 설명/주의/오류 문구 (명세서 §11.2, §17)
 */
export function FormHelperText({
  children,
  variant = "helper",
  id,
}: {
  children: React.ReactNode;
  variant?: "helper" | "warning" | "error";
  id?: string;
}) {
  const tone =
    variant === "error"
      ? "text-danger"
      : variant === "warning"
        ? "text-warning"
        : "text-neutral";

  return (
    <p id={id} className={`text-xs leading-5 ${tone}`}>
      {children}
    </p>
  );
}
