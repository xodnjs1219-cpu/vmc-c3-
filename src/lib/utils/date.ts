import { format, isValid, parseISO, startOfDay } from 'date-fns';

const DISPLAY_DATE_FORMAT = 'yyyy.MM.dd';
const INPUT_DATE_FORMAT = 'yyyy-MM-dd';

export const formatShortDate = (isoDate: string) => {
  const parsed = parseISO(isoDate);

  if (!isValid(parsed)) {
    return '';
  }

  return format(parsed, DISPLAY_DATE_FORMAT);
};

export const formatConcertPeriod = (startIso: string, endIso: string) => {
  const startDate = parseISO(startIso);
  const endDate = parseISO(endIso);

  if (!isValid(startDate) || !isValid(endDate)) {
    return '';
  }

  const startText = format(startDate, DISPLAY_DATE_FORMAT);
  const endText = format(endDate, DISPLAY_DATE_FORMAT);

  return startText === endText ? startText : `${startText} ~ ${endText}`;
};

export const toDateInputValue = (isoDate: string | undefined) => {
  if (!isoDate) {
    return '';
  }

  const parsed = parseISO(isoDate);

  if (!isValid(parsed)) {
    return '';
  }

  return format(parsed, INPUT_DATE_FORMAT);
};

export const toIsoFromDateInput = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const date = startOfDay(new Date(value));

  if (!isValid(date)) {
    return undefined;
  }

  return date.toISOString();
};
