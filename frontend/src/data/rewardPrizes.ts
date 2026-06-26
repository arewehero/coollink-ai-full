/**
 * 컬렉션 완성 보상 룰렛 상품 (시연용)
 * 추후 API로 교체하기 쉽도록 데이터는 이 파일에만 둔다.
 */
export type PrizeType = "GIFT_CARD" | "COUPON" | "ENTRY";

export type Prize = {
  id: string;
  name: string;
  description: string;
  type: PrizeType;
};

export const REWARD_PRIZES: Prize[] = [
  {
    id: "culture-5000",
    name: "문화상품권 5,000원권",
    description: "어디서나 쓸 수 있는 문화상품권이에요.",
    type: "GIFT_CARD",
  },
  {
    id: "cu-3000",
    name: "CU 모바일상품권 3,000원권",
    description: "가까운 CU에서 사용할 수 있어요.",
    type: "GIFT_CARD",
  },
  {
    id: "starbucks-americano",
    name: "스타벅스 아메리카노 쿠폰",
    description: "따뜻한 아메리카노 한 잔 어떠세요?",
    type: "COUPON",
  },
  {
    id: "delivery-3000",
    name: "배달앱 할인쿠폰 3,000원권",
    description: "배달 주문 시 사용할 수 있어요.",
    type: "COUPON",
  },
  {
    id: "convenience-icecream",
    name: "편의점 아이스크림 쿠폰",
    description: "시원한 아이스크림 교환권이에요.",
    type: "COUPON",
  },
  {
    id: "eco-goods-entry",
    name: "친환경 굿즈 응모권",
    description: "친환경 굿즈 추첨에 응모할 수 있어요.",
    type: "ENTRY",
  },
];

export function getPrizeById(id: string): Prize | undefined {
  return REWARD_PRIZES.find((p) => p.id === id);
}
