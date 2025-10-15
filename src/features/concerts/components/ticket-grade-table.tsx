'use client';

import { SEAT_GRADE_LABELS } from '@/features/concerts/constants';
import type { SeatAvailability } from '@/features/concerts/lib/dto';

const SECTION_CLASS = 'space-y-4';
const TABLE_WRAPPER_CLASS = 'overflow-hidden rounded-lg border border-gray-200 shadow-sm';
const TABLE_CLASS = 'w-full';
const HEADER_CELL_CLASS = 'px-4 py-3 text-left text-sm font-semibold text-gray-700';
const HEADER_CELL_RIGHT_CLASS = 'px-4 py-3 text-right text-sm font-semibold text-gray-700';
const HEADER_ROW_CLASS = 'bg-gray-50';
const BODY_CLASS = 'divide-y divide-gray-200';
const ROW_CLASS = 'bg-white transition hover:bg-gray-50';
const CELL_GRADE_CLASS = 'px-4 py-3 text-sm font-medium text-gray-900';
const CELL_PRICE_CLASS = 'px-4 py-3 text-right text-sm text-gray-700';
const CELL_AVAILABLE_CLASS = 'px-4 py-3 text-right text-sm text-indigo-600 font-medium';
const SECTION_TITLE_CLASS = 'text-xl font-semibold text-gray-900';
const PRICE_SUFFIX = '원';
const AVAILABLE_SUFFIX = '석';

export type TicketGradeTableProps = {
  grades: SeatAvailability[];
};

export function TicketGradeTable({ grades }: TicketGradeTableProps) {
  if (grades.length === 0) {
    return null;
  }

  return (
    <section className={SECTION_CLASS}>
      <h2 className={SECTION_TITLE_CLASS}>등급별 가격 및 잔여 좌석</h2>

      <div className={TABLE_WRAPPER_CLASS}>
        <table className={TABLE_CLASS}>
          <thead className={HEADER_ROW_CLASS}>
            <tr>
              <th scope="col" className={HEADER_CELL_CLASS}>
                등급
              </th>
              <th scope="col" className={HEADER_CELL_RIGHT_CLASS}>
                가격
              </th>
              <th scope="col" className={HEADER_CELL_RIGHT_CLASS}>
                잔여 좌석
              </th>
            </tr>
          </thead>
          <tbody className={BODY_CLASS}>
            {grades.map((grade) => (
              <tr key={grade.grade} className={ROW_CLASS}>
                <td className={CELL_GRADE_CLASS}>
                  {SEAT_GRADE_LABELS[grade.grade] ?? grade.grade.toUpperCase()}
                </td>
                <td className={CELL_PRICE_CLASS}>
                  {grade.price.toLocaleString()}
                  {PRICE_SUFFIX}
                </td>
                <td className={CELL_AVAILABLE_CLASS}>
                  {grade.availableCount.toLocaleString()}
                  {AVAILABLE_SUFFIX}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
