/**
 * AssumptionNotice — 예상값 안내 (명세서 §10.7 하단 안내, §10.8, §20.2)
 */
export function AssumptionNotice() {
  return (
    <p className="px-1 pb-2 text-center text-xs leading-5 text-neutral">
      예상 절약액·전력·CO₂는 입력값과 날씨를 바탕으로 한 추정치예요. 실제 청구
      요금과 다를 수 있어요.
    </p>
  );
}
