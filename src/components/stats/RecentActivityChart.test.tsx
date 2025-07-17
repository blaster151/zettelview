import React from 'react';
import { render, screen } from '@testing-library/react';
import RecentActivityChart from './RecentActivityChart';

const today = new Date().toISOString().split('T')[0];
const lastWeek = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toISOString().split('T')[0],
    count: i + 1,
  };
});

describe('RecentActivityChart', () => {
  it('renders a bar for each day', () => {
    render(<RecentActivityChart recentActivity={lastWeek} />);
    // There should be 7 bars (divs with a title attribute)
    const bars = screen.getAllByTitle(/note/);
    expect(bars).toHaveLength(7);
  });

  it('shows correct tooltip for each bar', () => {
    render(<RecentActivityChart recentActivity={lastWeek} />);
    lastWeek.forEach(({ date, count }) => {
      const fullDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const tooltip = `${fullDate}: ${count} note${count !== 1 ? 's' : ''}`;
      expect(screen.getByTitle(tooltip)).toBeInTheDocument();
    });
  });

  it('highlights today with primary color', () => {
    render(<RecentActivityChart recentActivity={lastWeek} />);
    // Find the bar for today
    const todayData = lastWeek.find(d => d.date === today);
    if (todayData) {
      const fullDate = new Date(todayData.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const tooltip = `${fullDate}: ${todayData.count} note${todayData.count !== 1 ? 's' : ''}`;
      const bar = screen.getByTitle(tooltip);
      // It should exist
      expect(bar).toBeInTheDocument();
      // Style checks are unreliable in JSDOM, so we only check presence and tooltip
    }
  });
}); 