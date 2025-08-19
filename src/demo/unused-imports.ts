/**
 * Demo file showing unused import patterns
 * This demonstrates the CodeRabbit pattern: "Remove unused import"
 */

import lodash from 'lodash'; // This import is unused
import { format } from 'date-fns';
import React from 'react';

/**
 * Format the current date as YYYY-MM-DD string
 * @returns Formatted date string
 */
export function formatCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}