import { evolve, map } from 'ramda';
import {
  fromDate, getLocalTimeZone, parseDate, parseZonedDateTime, toCalendarDate,
} from '@internationalized/date';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import entities2023 from './test-data.json';

export interface BoardData {
  board: BoardInfo,
  crops: CropTerm[],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  tasks: LogResource[],
}

const stringifyDate = (d: Date) =>
  toCalendarDate(fromDate(d, getLocalTimeZone())).toString();
const stringifyDateTime = (d: Date) =>
  fromDate(d, getLocalTimeZone()).toString();
const fmtBeforeSerialize = evolve({
  tasks: t => t.map(evolve({ date: stringifyDateTime })),
  board: evolve({ dateRange: map(stringifyDate) })
}) as (data: BoardData) => typeof entities2023;

export function serialize(
  data: BoardData,
  replacer?: ((key: string, val: any) => any) | (string | number)[] | null,
  space?: string | number,
): string {
  const board = fmtBeforeSerialize(data);
  if (!replacer) return JSON.stringify(board, null, space);
  if (Array.isArray(replacer)) {
    replacer as (string | number)[];
    return JSON.stringify(board, replacer, space);
  }
  replacer as (key: string, val: any) => any;
  return JSON.stringify(board, replacer, space);
}

const objectifyDate = (str: string) =>
  parseDate(str).toDate(getLocalTimeZone());
const objectifyDateTime = (str: string) =>
  parseZonedDateTime(str).toDate();
const fmtAfterDeserialize = evolve({
  tasks: t => t.map(evolve({ date: objectifyDateTime })),
  board: evolve({ dateRange: map(objectifyDate) }),
}) as (json: typeof entities2023) => BoardData;

export function deserialize(
  json: string,
  reviver?: ((key: string, val: any) => any) | undefined,
): BoardData {
  const data = JSON.parse(json, reviver);
  return fmtAfterDeserialize(data);
}

export const {
  crops: crops2023,
  locations: locations2023,
  operations: operations2023,
  plants: plants2023,
  tasks: tasks2023,
  board: boardInfo2023,
} = fmtAfterDeserialize(entities2023) as BoardData;
