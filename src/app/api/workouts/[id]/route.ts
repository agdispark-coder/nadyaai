import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/workouts/[id] — get single workout
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Only allow access to own workouts or public workouts
    if (workout.userId !== session.userId && !workout.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('GET /api/workouts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

// PUT /api/workouts/[id] — update workout
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      duration,
      difficulty,
      notes,
      calories,
      isPublic,
      exercises,
    } = body;

    // Verify ownership
    const existing = await prisma.workout.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (duration !== undefined) updateData.duration = duration;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (notes !== undefined) updateData.notes = notes;
    if (calories !== undefined) updateData.calories = calories;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const result = await prisma.$transaction(async (tx) => {
      // Update workout fields
      await tx.workout.update({
        where: { id },
        data: updateData,
      });

      // If exercises provided, replace them all
      if (exercises && Array.isArray(exercises)) {
        await tx.exercise.deleteMany({ where: { workoutId: id } });

        if (exercises.length > 0) {
          await tx.exercise.createMany({
            data: exercises.map(
              (ex: {
                name: string;
                sets?: number;
                reps?: number;
                weight?: number;
                duration?: number;
                distance?: number;
                order: number;
              }) => ({
                workoutId: id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                duration: ex.duration,
                distance: ex.distance,
                order: ex.order ?? 0,
              })
            ),
          });
        }
      }

      // Fetch updated workout with new exercises
      return tx.workout.findUnique({
        where: { id },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
    });

    return NextResponse.json({ workout: result });
  } catch (error) {
    console.error('PUT /api/workouts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] — delete workout
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.workout.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.workout.delete({ where: { id } });

    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/workouts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}
