import { format, isValid, parseISO, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

const DISPLAY_DATE_FORMAT = 'yyyy.MM.dd';
const INPUT_DATE_FORMAT = 'yyyy-MM-dd';
const DATE_TIME_DISPLAY_FORMAT = 'yyyy년 M월 d일 (E) HH:mm';

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

export const formatDateTime = (value: string, pattern: string = DATE_TIME_DISPLAY_FORMAT) => {
  const parsed = parseISO(value);

  if (!isValid(parsed)) {
    return '';
  }

  return format(parsed, pattern, { locale: ko });
};
