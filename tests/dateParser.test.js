/**
 * Tests for natural language date parser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseNaturalDate,
  formatDate,
  getRelativeTime,
  isOverdue,
  isDueSoon,
  isValidDateString,
} from '../src/utils/dateParser.js';

describe('parseNaturalDate - Basic Dates', () => {
  let referenceDate;

  beforeEach(() => {
    // Use a fixed reference date for consistent testing
    // January 15, 2025, 10:00 AM
    referenceDate = new Date('2025-01-15T10:00:00Z');
  });

  it('should parse "today"', () => {
    const result = parseNaturalDate('today', referenceDate);
    expect(result.toDateString()).toBe(referenceDate.toDateString());
  });

  it('should parse "tomorrow"', () => {
    const result = parseNaturalDate('tomorrow', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() + 1);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "yesterday"', () => {
    const result = parseNaturalDate('yesterday', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() - 1);
    expect(result.toDateString()).toBe(expected.toDateString());
  });
});

describe('parseNaturalDate - Weekdays', () => {
  let referenceDate;

  beforeEach(() => {
    // Wednesday, January 15, 2025
    referenceDate = new Date('2025-01-15T10:00:00Z');
  });

  it('should parse "next Monday"', () => {
    const result = parseNaturalDate('next Monday', referenceDate);
    // Next Monday should be January 20, 2025
    expect(result.getDate()).toBe(20);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('should parse "next Friday"', () => {
    const result = parseNaturalDate('next Friday', referenceDate);
    // Next Friday should be January 17, 2025
    expect(result.getDate()).toBe(17);
    expect(result.getDay()).toBe(5); // Friday
  });

  it('should parse "last Monday"', () => {
    const result = parseNaturalDate('last Monday', referenceDate);
    // Last Monday should be January 13, 2025
    expect(result.getDate()).toBe(13);
    expect(result.getDay()).toBe(1); // Monday
  });
});

describe('parseNaturalDate - Relative Dates', () => {
  let referenceDate;

  beforeEach(() => {
    referenceDate = new Date('2025-01-15T10:00:00Z');
  });

  it('should parse "in 3 days"', () => {
    const result = parseNaturalDate('in 3 days', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() + 3);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "in 2 weeks"', () => {
    const result = parseNaturalDate('in 2 weeks', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() + 14);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "in 1 month"', () => {
    const result = parseNaturalDate('in 1 month', referenceDate);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it('should parse "3 days ago"', () => {
    const result = parseNaturalDate('3 days ago', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() - 3);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "2 weeks ago"', () => {
    const result = parseNaturalDate('2 weeks ago', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() - 14);
    expect(result.toDateString()).toBe(expected.toDateString());
  });
});

describe('parseNaturalDate - Period Shortcuts', () => {
  let referenceDate;

  beforeEach(() => {
    referenceDate = new Date('2025-01-15T10:00:00Z');
  });

  it('should parse "next week"', () => {
    const result = parseNaturalDate('next week', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() + 7);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "next month"', () => {
    const result = parseNaturalDate('next month', referenceDate);
    expect(result.getMonth()).toBe(1); // February
  });

  it('should parse "last week"', () => {
    const result = parseNaturalDate('last week', referenceDate);
    const expected = new Date(referenceDate);
    expected.setDate(expected.getDate() - 7);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('should parse "end of week"', () => {
    const result = parseNaturalDate('end of week', referenceDate);
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(19); // January 19, 2025
  });

  it('should parse "end of month"', () => {
    const result = parseNaturalDate('end of month', referenceDate);
    expect(result.getDate()).toBe(31); // January 31
  });

  it('should parse "start of week"', () => {
    const result = parseNaturalDate('start of week', referenceDate);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(13); // January 13, 2025
  });

  it('should parse "start of month"', () => {
    const result = parseNaturalDate('start of month', referenceDate);
    expect(result.getDate()).toBe(1);
  });
});

describe('parseNaturalDate - ISO Dates', () => {
  it('should parse ISO date format', () => {
    const result = parseNaturalDate('2025-03-20');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March (0-indexed)
    expect(result.getDate()).toBe(20);
  });
});

describe('parseNaturalDate - US Date Formats', () => {
  it('should parse MM/DD/YYYY format', () => {
    const result = parseNaturalDate('03/20/2025');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(20);
  });

  it('should parse M/D/YY format', () => {
    const result = parseNaturalDate('3/20/25');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(20);
  });
});

describe('parseNaturalDate - Time Parsing', () => {
  let referenceDate;

  beforeEach(() => {
    referenceDate = new Date('2025-01-15T10:00:00Z');
  });

  it('should parse "tomorrow at 3pm"', () => {
    const result = parseNaturalDate('tomorrow at 3pm', referenceDate);
    expect(result.getHours()).toBe(15);
    expect(result.getMinutes()).toBe(0);
  });

  it('should parse "next Monday at 9:30am"', () => {
    const result = parseNaturalDate('next Monday at 9:30am', referenceDate);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('should parse "tomorrow at 14:30" (24-hour format)', () => {
    const result = parseNaturalDate('tomorrow at 14:30', referenceDate);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('should parse "tomorrow at noon"', () => {
    const result = parseNaturalDate('tomorrow at noon', referenceDate);
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(0);
  });

  it('should parse "tomorrow at midnight"', () => {
    const result = parseNaturalDate('tomorrow at midnight', referenceDate);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('parseNaturalDate - Invalid Input', () => {
  it('should return null for invalid input', () => {
    expect(parseNaturalDate('invalid date string')).toBeNull();
    expect(parseNaturalDate('')).toBeNull();
    expect(parseNaturalDate(null)).toBeNull();
    expect(parseNaturalDate(undefined)).toBeNull();
  });
});

describe('formatDate', () => {
  const testDate = new Date('2025-01-15T14:30:00Z');

  it('should format with short format', () => {
    const result = formatDate(testDate, 'short');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should format with medium format (default)', () => {
    const result = formatDate(testDate);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should format with long format', () => {
    const result = formatDate(testDate, 'long');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should format with time format', () => {
    const result = formatDate(testDate, 'time');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should format relative dates', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(formatDate(today, 'relative')).toBe('Today');
    expect(formatDate(tomorrow, 'relative')).toBe('Tomorrow');
  });
});

describe('getRelativeTime', () => {
  it('should calculate relative time differences', () => {
    const now = new Date('2025-01-15T10:00:00Z');
    const future = new Date('2025-01-18T14:30:00Z');

    const relative = getRelativeTime(future, now);

    expect(relative.days).toBe(3);
    expect(relative.hours).toBeGreaterThan(75);
    expect(relative.minutes).toBeGreaterThan(4500);
  });

  it('should handle past dates (negative differences)', () => {
    const now = new Date('2025-01-15T10:00:00Z');
    const past = new Date('2025-01-10T10:00:00Z');

    const relative = getRelativeTime(past, now);

    expect(relative.days).toBe(-5);
  });
});

describe('isOverdue', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  it('should identify overdue dates', () => {
    const pastDate = new Date('2025-01-10T10:00:00Z');
    expect(isOverdue(pastDate, now)).toBe(true);
  });

  it('should identify non-overdue dates', () => {
    const futureDate = new Date('2025-01-20T10:00:00Z');
    expect(isOverdue(futureDate, now)).toBe(false);
  });

  it('should handle null dates', () => {
    expect(isOverdue(null, now)).toBe(false);
  });
});

describe('isDueSoon', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  it('should identify dates due soon (within 3 days)', () => {
    const soonDate = new Date('2025-01-17T10:00:00Z');
    expect(isDueSoon(soonDate, 3, now)).toBe(true);
  });

  it('should identify dates not due soon', () => {
    const laterDate = new Date('2025-01-25T10:00:00Z');
    expect(isDueSoon(laterDate, 3, now)).toBe(false);
  });

  it('should not identify overdue dates as due soon', () => {
    const pastDate = new Date('2025-01-10T10:00:00Z');
    expect(isDueSoon(pastDate, 3, now)).toBe(false);
  });

  it('should handle custom thresholds', () => {
    const date = new Date('2025-01-22T10:00:00Z');
    expect(isDueSoon(date, 7, now)).toBe(true);
    expect(isDueSoon(date, 3, now)).toBe(false);
  });
});

describe('isValidDateString', () => {
  it('should validate correct date strings', () => {
    expect(isValidDateString('tomorrow')).toBe(true);
    expect(isValidDateString('next Monday')).toBe(true);
    expect(isValidDateString('2025-01-15')).toBe(true);
    expect(isValidDateString('in 3 days')).toBe(true);
  });

  it('should invalidate incorrect date strings', () => {
    expect(isValidDateString('invalid')).toBe(false);
    expect(isValidDateString('xyz')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});
