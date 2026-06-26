import { ScreenPlaceholder } from "@/components/common/ScreenPlaceholder";

/** `/today/actions/[actionId]` 행동 상세 (명세서 §5, §10.11) — 프로필 완료 시 진입 */
export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;

  return (
    <ScreenPlaceholder
      title="행동 상세"
      subtitle="추천 이유 · 계산 기준"
      route={`/today/actions/${actionId}`}
      description="개별 행동의 추천 이유 전체 문장과 계산 기준, 예상 절약액 안내, 완료/취소 버튼을 보여주는 상세 화면입니다."
      todo={[
        "행동 이유 전체 문장",
        "계산 기준 안내 + 예상값 안내",
        "해당 행동 완료/취소 버튼",
      ]}
    />
  );
}
