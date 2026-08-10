import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const shifts = [
  {
    id: '1',
    date: 'Aug 9, 2026',
    startTime: '8:00 AM',
    endTime: '2:30 PM',
    durationMin: 390,
    earnings: 97.5,
    route: 'Downtown Loop',
  },
  {
    id: '2',
    date: 'Aug 8, 2026',
    startTime: '10:00 AM',
    endTime: '4:00 PM',
    durationMin: 360,
    earnings: 90.0,
    route: 'Suburban North',
  },
  {
    id: '3',
    date: 'Aug 7, 2026',
    startTime: '9:00 AM',
    endTime: '3:00 PM',
    durationMin: 360,
    earnings: 90.0,
    route: 'Highway 45',
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: shifts });
}
