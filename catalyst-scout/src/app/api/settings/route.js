import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const appSettings = await prisma.appSetting.findMany();
    const scraperSettings = await prisma.scraperSetting.findMany();
    
    // Convert appSettings array to object { key: value }
    const settingsObj = appSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({
      appSettings: settingsObj,
      scraperSettings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Accept an array of AppSetting updates
    if (body.appSettings && Array.isArray(body.appSettings)) {
      for (const { key, value } of body.appSettings) {
        await prisma.appSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }
    
    // Accept an array of ScraperSetting updates
    if (body.scraperSettings && Array.isArray(body.scraperSettings)) {
      for (const item of body.scraperSettings) {
        if (item.id) {
          await prisma.scraperSetting.update({
            where: { id: item.id },
            data: {
              cronSchedule: item.cronSchedule,
              isActive: item.isActive,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
