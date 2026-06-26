import { internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { baseRate: "asc" },
      select: {
        id: true,
        name: true,
        capacity: true,
        baseRate: true,
      },
    });

    return Response.json({ roomTypes });
  } catch (error) {
    console.error("Failed to get room types", error);
    return internalServerError();
  }
}
