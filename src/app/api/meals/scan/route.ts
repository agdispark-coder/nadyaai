import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// POST /api/meals/scan — AI food scan
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'image (base64 string) is required' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Image = image.includes(',') ? image.split(',')[1] : image;

    // AI scan returns demo data on Netlify (z-ai-web-dev-sdk is dev-only)
    // In production, integrate your preferred AI vision API here
    return NextResponse.json({
      scan: {
        items: [
          { name: 'Grilled Chicken Breast', amount: 150, unit: 'g', calories: 248, protein: 46, carbs: 0, fats: 5.4 },
          { name: 'Brown Rice', amount: 200, unit: 'g', calories: 260, protein: 5.4, carbs: 54, fats: 2.1 },
          { name: 'Mixed Salad', amount: 100, unit: 'g', calories: 20, protein: 1.5, carbs: 3, fats: 0.2 },
        ],
        totalCalories: 528,
        totalProtein: 52.9,
        totalCarbs: 57,
        totalFats: 7.7,
      },
    });
  } catch (error) {
    console.error('POST /api/meals/scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan food image' },
      { status: 500 }
    );
  }
}
