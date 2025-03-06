import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.smartsheet.com/2.0/sheets/7613454455465860', {
      headers: {
        'Authorization': 'Bearer Vcc3Y2aQ0FSM3cH32UfdH6unCQkgNwQHzObWY',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Smartsheet API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Smartsheet' },
      { status: 500 }
    );
  }
} 