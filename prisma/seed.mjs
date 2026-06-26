import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roomTypes = [
    { name: "スタンダードシングル", capacity: 1, baseRate: 12000, rooms: ["0301", "0302"] },
    { name: "デラックスツイン", capacity: 2, baseRate: 24000, rooms: ["0805", "0806"] },
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
