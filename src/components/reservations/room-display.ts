import type { StaticImageData } from "next/image";

import roomDeluxeTwin from "@/assets/room-deluxe-twin.webp";
import roomFamily from "@/assets/room-family.webp";
import roomStandardSingle from "@/assets/room-standard-single.webp";
import roomSuite from "@/assets/room-suite.webp";
import roomSuperiorDouble from "@/assets/room-superior-double.webp";

type RoomDetail = {
  lead: string;
  size: string;
  bed: string;
  floor: string;
  amenities: string[];
  notes: string[];
};

const ROOM_IMAGES: Record<string, StaticImageData> = {
  スタンダードシングル: roomStandardSingle,
  コンフォートダブル: roomSuperiorDouble,
  スーペリアダブル: roomSuperiorDouble,
  デラックスツイン: roomDeluxeTwin,
  プレミアムツイン: roomDeluxeTwin,
  ファミリールーム: roomFamily,
  和室スイート: roomSuite,
};

const DEFAULT_ROOM_DETAIL: RoomDetail = {
  lead: "ゆとりある滞在に必要な設備を整えた客室です。",
  size: "28㎡",
  bed: "ベッド構成は客室タイプにより異なります",
  floor: "3〜10階",
  amenities: ["無料Wi-Fi", "デスク", "冷蔵庫", "電気ケトル", "加湿空気清浄機"],
  notes: ["全室禁煙"],
};

const ROOM_DETAILS: Record<string, RoomDetail> = {
  スタンダードシングル: {
    lead: "一人旅や出張に使いやすい、コンパクトで落ち着いた客室です。",
    size: "18㎡",
    bed: "シングルベッド 1台",
    floor: "3階",
    amenities: ["無料Wi-Fi", "デスク", "冷蔵庫", "電気ケトル"],
    notes: ["全室禁煙"],
  },
  コンフォートダブル: {
    lead: "二名利用でも過ごしやすい、機能性を重視したダブルルームです。",
    size: "24㎡",
    bed: "ダブルベッド 1台",
    floor: "4階",
    amenities: ["無料Wi-Fi", "ソファ", "デスク", "冷蔵庫", "加湿空気清浄機"],
    notes: ["全室禁煙"],
  },
  スーペリアダブル: {
    lead: "広めのベッドとくつろぎスペースを備えた、滞在時間を楽しめる客室です。",
    size: "28㎡",
    bed: "クイーンベッド 1台",
    floor: "5階",
    amenities: ["無料Wi-Fi", "ソファ", "デスク", "冷蔵庫", "加湿空気清浄機"],
    notes: ["全室禁煙"],
  },
  デラックスツイン: {
    lead: "ご家族やご友人との宿泊に向いた、ベッドを分けて使える客室です。",
    size: "34㎡",
    bed: "セミダブルベッド 2台",
    floor: "7階",
    amenities: ["無料Wi-Fi", "ソファ", "デスク", "冷蔵庫", "独立洗面台"],
    notes: ["全室禁煙"],
  },
  プレミアムツイン: {
    lead: "上層階の落ち着いた空間で、余裕のある滞在ができるツインルームです。",
    size: "38㎡",
    bed: "セミダブルベッド 2台",
    floor: "8階",
    amenities: ["無料Wi-Fi", "ソファ", "デスク", "冷蔵庫", "独立洗面台", "バスローブ"],
    notes: ["全室禁煙"],
  },
  ファミリールーム: {
    lead: "複数名での宿泊に便利な、荷物を広げやすいファミリー向け客室です。",
    size: "42㎡",
    bed: "セミダブルベッド 2台 + ソファベッド",
    floor: "9階",
    amenities: ["無料Wi-Fi", "ソファ", "デスク", "冷蔵庫", "独立洗面台", "電子レンジ"],
    notes: ["全室禁煙"],
  },
  和室スイート: {
    lead: "畳のくつろぎと寝室を分けて使える、特別な日の滞在に向いた客室です。",
    size: "52㎡",
    bed: "布団 最大4組",
    floor: "10階",
    amenities: ["無料Wi-Fi", "座卓", "冷蔵庫", "独立洗面台", "バスローブ", "茶器セット"],
    notes: ["全室禁煙"],
  },
};

export function roomImage(name: string) {
  return ROOM_IMAGES[name] ?? roomFamily;
}

export function roomDetail(name: string) {
  return ROOM_DETAILS[name] ?? DEFAULT_ROOM_DETAIL;
}
