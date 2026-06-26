/**
 * 멸종위기종 캐릭터 데이터 (뽑기/컬렉션용)
 *
 * 이미지: public/endangered-species/{id}.png (컬러), {id}_silhouette.png (실루엣)
 * 추후 API로 교체하기 쉽도록 데이터는 이 파일에만 둔다.
 */
export type Rarity = "RARE" | "EPIC" | "LEGENDARY";

export type Species = {
  id: string;
  nameKo: string;
  nameEn: string;
  description: string;
  rarity: Rarity;
  image: string;
  silhouette: string;
};

/** 표시용 등급명: 친구(RARE) / 레어(EPIC) / 초레어(LEGENDARY) */
export const RARITY_LABEL: Record<Rarity, string> = {
  RARE: "친구",
  EPIC: "레어",
  LEGENDARY: "초레어",
};

function species(
  id: string,
  nameKo: string,
  nameEn: string,
  rarity: Rarity,
  description: string,
): Species {
  return {
    id,
    nameKo,
    nameEn,
    rarity,
    description,
    image: `/endangered-species/${id}.png`,
    silhouette: `/endangered-species/${id}_silhouette.png`,
  };
}

export const ENDANGERED_SPECIES: Species[] = [
  species(
    "axolotl",
    "우파루파",
    "Axolotl",
    "RARE",
    "머리 양옆의 깃털 같은 아가미가 특징인 귀여운 양서류예요.",
  ),
  species(
    "ili-pika",
    "일리 피카",
    "Ili Pika",
    "RARE",
    "작은 토끼처럼 생긴 산악 동물로, 동그란 귀와 얼굴이 매력적이에요.",
  ),
  species(
    "kakapo",
    "카카포",
    "Kakapo",
    "EPIC",
    "날지 못하는 통통한 앵무새로, 숲을 닮은 초록빛 깃털을 가졌어요.",
  ),
  species(
    "sunda-pangolin",
    "순다 천산갑",
    "Sunda Pangolin",
    "EPIC",
    "몸을 덮은 비늘 갑옷이 특징인 신비로운 동물이에요.",
  ),
  species(
    "vaquita",
    "바키타",
    "Vaquita",
    "LEGENDARY",
    "눈가의 검은 무늬가 귀여운, 아주 희귀한 작은 돌고래류예요.",
  ),
  species(
    "javan-slow-loris",
    "자바늘림보원숭이",
    "Javan Slow Loris",
    "RARE",
    "커다란 눈과 느릿한 움직임이 특징인 야행성 동물이에요.",
  ),
  species(
    "pygmy-three-toed-sloth",
    "피그미 세발가락나무늘보",
    "Pygmy Three-toed Sloth",
    "EPIC",
    "작은 몸집과 느긋한 표정이 사랑스러운 나무늘보예요.",
  ),
  species(
    "saola",
    "사올라",
    "Saola",
    "LEGENDARY",
    "긴 뿔 때문에 '아시아의 유니콘'이라고 불리는 신비로운 동물이에요.",
  ),
  species(
    "numbat",
    "넘뱃",
    "Numbat",
    "RARE",
    "줄무늬 등과 긴 주둥이가 특징인 귀여운 개미먹이 동물이에요.",
  ),
  species(
    "red-panda",
    "레서판다",
    "Red Panda",
    "EPIC",
    "복슬복슬한 꼬리와 붉은 털이 매력적인 숲속 친구예요.",
  ),
  // --- 추가 5종 ---
  species(
    "okapi",
    "오카피",
    "Okapi",
    "EPIC",
    "얼룩말 같은 다리 무늬와 큰 귀가 특징인 숲속의 신비로운 동물이에요.",
  ),
  species(
    "golden-snub-nosed-monkey",
    "황금들창코원숭이",
    "Golden Snub-nosed Monkey",
    "EPIC",
    "황금빛 털과 작고 파란 코가 특징인 귀여운 원숭이예요.",
  ),
  species(
    "northern-hairy-nosed-wombat",
    "북부털코웜뱃",
    "Northern Hairy-nosed Wombat",
    "LEGENDARY",
    "통통한 몸과 큰 코가 매력적인 아주 희귀한 웜뱃이에요.",
  ),
  species(
    "black-footed-ferret",
    "검은발족제비",
    "Black-footed Ferret",
    "RARE",
    "눈가의 검은 마스크와 긴 몸이 특징인 장난꾸러기 같은 동물이에요.",
  ),
  species(
    "amami-rabbit",
    "아마미토끼",
    "Amami Rabbit",
    "RARE",
    "짧은 귀와 동그란 몸이 귀여운 일본의 희귀한 숲속 토끼예요.",
  ),
];

export const SPECIES_COUNT = ENDANGERED_SPECIES.length;

export function getSpeciesById(id: string): Species | undefined {
  return ENDANGERED_SPECIES.find((s) => s.id === id);
}
