/**
 * Natural language date parser for Dash-Plus Notes
 *
 * Converts human-readable date strings into Date objects.
 *
 * Supported formats:
 * - "today", "tomorrow", "yesterday"
 * - "next Monday", "last Friday"
 * - "in 3 days", "in 2 weeks", "in 1 month"
 * - "3 days ago", "2 weeks ago"
 * - "next week", "next month"
 * - "end of week", "end of month"
 * - ISO dates: "2025-01-15"
 * - US dates: "01/15/2025", "1/15/25"
 * - Times: "at 3pm", "at 14:30", "at 9:00am"
 */

// ============================================================================
// DATE PARSING
// ============================================================================

export function parseNaturalDate(input, referenceDate = new Date()) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.toLowerCase().trim();

  // ISO date format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(normalized);
  }

  // US date format: MM/DD/YYYY or M/D/YY
  const usDateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usDateMatch) {
    const [, month, day, year] = usDateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // Parse relative dates
  let date = new Date(referenceDate);

  // Today, tomorrow, yesterday
  if (normalized === 'today') {
    return setTime(date, normalized);
  }

  if (normalized === 'tomorrow') {
    date.setDate(date.getDate() + 1);
    return setTime(date, normalized);
  }

  if (normalized === 'yesterday') {
    date.setDate(date.getDate() - 1);
    return setTime(date, normalized);
  }

  // Next/Last weekday (e.g., "next Monday", "last Friday")
  const weekdayMatch = normalized.match(/^(next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekdayMatch) {
    const [, direction, dayName] = weekdayMatch;
    return getWeekday(date, dayName, direction);
  }

  // In X days/weeks/months (e.g., "in 3 days", "in 2 weeks")
  const inMatch = normalized.match(/^in\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/);
  if (inMatch) {
    const [, amount, unit] = inMatch;
    return addTime(date, parseInt(amount), unit);
  }

  // X days/weeks/months ago (e.g., "3 days ago", "2 weeks ago")
  const agoMatch = normalized.match(/^(\d+)\s+(day|days|week|weeks|month|months|year|years)\s+ago$/);
  if (agoMatch) {
    const [, amount, unit] = agoMatch;
    return addTime(date, -parseInt(amount), unit);
  }

  // Next week/month/year
  const nextMatch = normalized.match(/^next\s+(week|month|year)$/);
  if (nextMatch) {
    const [, unit] = nextMatch;
    return addTime(date, 1, unit);
  }

  // Last week/month/year
  const lastMatch = normalized.match(/^last\s+(week|month|year)$/);
  if (lastMatch) {
    const [, unit] = lastMatch;
    return addTime(date, -1, unit);
  }

  // End of week/month/year
  const endOfMatch = normalized.match(/^end\s+of\s+(week|month|year)$/);
  if (endOfMatch) {
    const [, unit] = endOfMatch;
    return getEndOf(date, unit);
  }

  // Start of week/month/year
  const startOfMatch = normalized.match(/^start\s+of\s+(week|month|year)$/);
  if (startOfMatch) {
    const [, unit] = startOfMatch;
    return getStartOf(date, unit);
  }

  // Parse time component (e.g., "tomorrow at 3pm", "next Monday at 14:30")
  const timeMatch = input.match(/(.+?)\s+at\s+(.+)/i);
  if (timeMatch) {
    const [, datepart, timepart] = timeMatch;
    const parsedDate = parseNaturalDate(datepart, referenceDate);
    if (parsedDate) {
      return parseTime(parsedDate, timepart);
    }
  }

  // Fallback: try native Date parsing
  const fallbackDate = new Date(input);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  return null;
}

// ============================================================================
// TIME PARSING
// ============================================================================

function parseTime(date, timeString) {
  const normalized = timeString.toLowerCase().trim();

  // 24-hour format: 14:30, 09:00
  const time24Match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Match) {
    const [, hours, minutes] = time24Match;
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  }

  // 12-hour format: 3pm, 9:30am, 12:00pm
  const time12Match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (time12Match) {
    let [, hours, minutes = '0', period] = time12Match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Named times: noon, midnight, morning, afternoon, evening, night
  const namedTimes = {
    midnight: { hours: 0, minutes: 0 },
    morning: { hours: 9, minutes: 0 },
    noon: { hours: 12, minutes: 0 },
    afternoon: { hours: 15, minutes: 0 },
    evening: { hours: 18, minutes: 0 },
    night: { hours: 21, minutes: 0 },
  };

  if (namedTimes[normalized]) {
    const { hours, minutes } = namedTimes[normalized];
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  return date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function setTime(date, context) {
  // Default times based on context
  if (context.includes('at')) {
    return date; // Time will be parsed separately
  }

  // Default to 9 AM for future dates, current time for today
  if (context === 'today') {
    return date;
  }

  date.setHours(9, 0, 0, 0);
  return date;
}

function getWeekday(referenceDate, dayName, direction) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName);
  const currentDay = referenceDate.getDay();

  let daysToAdd;

  if (direction === 'next') {
    daysToAdd = (targetDay + 7 - currentDay) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7; // Next week, not today
    }
  } else {
    // last
    daysToAdd = (currentDay - targetDay) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7;
    }
    daysToAdd = -daysToAdd;
  }

  const date = new Date(referenceDate);
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(9, 0, 0, 0);
  return date;
}

function addTime(referenceDate, amount, unit) {
  const date = new Date(referenceDate);

  const normalizedUnit = unit.replace(/s$/, ''); // Remove plural 's'

  switch (normalizedUnit) {
    case 'day':
      date.setDate(date.getDate() + amount);
      break;

    case 'week':
      date.setDate(date.getDate() + amount * 7);
      break;

    case 'month':
      date.setMonth(date.getMonth() + amount);
      break;

    case 'year':
      date.setFullYear(date.getFullYear() + amount);
      break;

    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }

  return date;
}

function getEndOf(referenceDate, unit) {
  const date = new Date(referenceDate);

  switch (unit) {
    case 'week':
      // End of week = Sunday
      const daysUntilSunday = 7 - date.getDay();
      date.setDate(date.getDate() + daysUntilSunday);
      date.setHours(23, 59, 59, 999);
      break;

    case 'month':
      date.setMonth(date.getMonth() + 1, 0); // Last day of current month
      date.setHours(23, 59, 59, 999);
      break;

    case 'year':
      date.setMonth(11, 31); // December 31
      date.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }

  return date;
}

function getStartOf(referenceDate, unit) {
  const date = new Date(referenceDate);

  switch (unit) {
    case 'week':
      // Start of week = Monday
      const daysUntilMonday = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - daysUntilMonday);
      date.setHours(0, 0, 0, 0);
      break;

    case 'month':
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      break;

    case 'year':
      date.setMonth(0, 1); // January 1
      date.setHours(0, 0, 0, 0);
      break;

    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }

  return date;
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Format a date as a human-readable string
 */
export function formatDate(date, format = 'medium') {
  if (!date) return '';
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Relative format for recent dates
  if (format === 'relative') {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  }

  // Standard formats
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit' },
    datetime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  };

  return date.toLocaleDateString('en-US', options[format] || options.medium);
}

/**
 * Get relative time description
 */
export function getRelativeTime(date, referenceDate = new Date()) {
  if (!date) return null;
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const diffMs = date.getTime() - referenceDate.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  return {
    milliseconds: diffMs,
    seconds: diffSeconds,
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
  };
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate, referenceDate = new Date()) {
  if (!dueDate) return false;
  if (!(dueDate instanceof Date)) {
    dueDate = new Date(dueDate);
  }

  return dueDate < referenceDate;
}

/**
 * Check if a date is due soon (within X days)
 */
export function isDueSoon(dueDate, daysThreshold = 3, referenceDate = new Date()) {
  if (!dueDate) return false;
  if (!(dueDate instanceof Date)) {
    dueDate = new Date(dueDate);
  }

  const diffMs = dueDate.getTime() - referenceDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= daysThreshold;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate if a string can be parsed as a date
 */
export function isValidDateString(input) {
  const parsed = parseNaturalDate(input);
  return parsed !== null && !isNaN(parsed.getTime());
}

/**
 * Get parsing suggestions for invalid input
 */
export function getDateSuggestions(input) {
  const suggestions = [
    'today',
    'tomorrow',
    'next Monday',
    'in 3 days',
    'in 2 weeks',
    'end of week',
    'YYYY-MM-DD (e.g., 2025-01-15)',
    'MM/DD/YYYY (e.g., 01/15/2025)',
  ];

  // Try to provide context-specific suggestions
  if (input && input.toLowerCase().includes('next')) {
    return [
      'next Monday',
      'next Tuesday',
      'next week',
      'next month',
      ...suggestions,
    ];
  }

  return suggestions;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  parseNaturalDate,
  formatDate,
  getRelativeTime,
  isOverdue,
  isDueSoon,
  isValidDateString,
  getDateSuggestions,
};
