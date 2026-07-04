import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roomTypes = [
    {
      name: "スタンダードシングル",
      capacity: 1,
      baseRate: 12000,
      rooms: ["0301", "0302", "0303", "0304", "0305"],
    },
    {
      name: "コンフォートダブル",
      capacity: 2,
      baseRate: 16000,
      rooms: ["0401", "0402", "0403", "0404"],
    },
    {
      name: "スーペリアダブル",
      capacity: 2,
      baseRate: 18000,
      rooms: ["0501", "0502", "0503", "0504", "0505"],
    },
    {
      name: "ファミリールーム",
      capacity: 4,
      baseRate: 22000,
      rooms: ["0701", "0702", "0703"],
    },
    {
      name: "デラックスツイン",
      capacity: 2,
      baseRate: 24000,
      rooms: ["0805", "0806", "0807", "0808"],
    },
    {
      name: "プレミアムツイン",
      capacity: 3,
      baseRate: 28000,
      rooms: ["0901", "0902", "0903"],
    },
    {
      name: "和室スイート",
      capacity: 4,
      baseRate: 38000,
      rooms: ["1001", "1002", "1003"],
    },
  ];

  for (const roomType of roomTypes) {
    const { rooms, ...data } = roomType;
    const savedRoomType = await prisma.roomType.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });

    for (const roomNumber of rooms) {
      await prisma.room.upsert({
        where: { roomNumber },
        update: { roomTypeId: savedRoomType.id },
        create: { roomNumber, roomTypeId: savedRoomType.id },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
