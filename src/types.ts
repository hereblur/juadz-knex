import {Knex} from 'knex';

export interface PlainObject {
  [key: string]: unknown;
}

export type IConnectionProvider = (
  _resourceName: string,
  _action: string
) => Knex;
