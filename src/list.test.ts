import {KnexQueryList} from './list';
import {IQueryListResults} from '@juadz/core';
import Knex from 'knex';
import {unlink} from 'fs';

let knex: any;

beforeAll(async () => {
  knex = Knex({
    client: 'sqlite3',
    connection: {
      filename: '/tmp/test.sqlite',
    },
    useNullAsDefault: true,
  });

  await knex.schema.createTable('users', (table: any) => {
    table.increments();
    table.string('name');
    table.string('last_name');
    table.integer('age');
    table.string('tool');
  });

  await knex('users').insert([
    {name: 'Peter', last_name: 'Parker', age: 11, tool: 'ruler'},
    {name: 'Mark', last_name: 'Olivier', age: 18, tool: 'pencil'},
    {name: 'Andre', last_name: 'Hudson', age: 18, tool: 'pen'},
    {name: 'Tony', last_name: 'Oliver', age: 18, tool: 'pen'},
    {name: 'Bruce', last_name: 'Pedersen', age: 13, tool: 'crayon'},
  ]);
});

afterAll(() => {
  unlink('/tmp/test.sqlite', () => {});
});

test('KnexQueryList', async () => {
  const func = KnexQueryList({
    debug: true,
    searchFields: ['name', 'last_name'],
  });

  const result: IQueryListResults = await func(knex('users'), {
    resource: 'users',
    range: {offset: 0, limit: 10},
    sort: [{field: 'age', direction: 'ASC'}],
    filter: [
      {field: 'q', op: '=', value: 'Pe'},
      {field: 'age', op: 'between', value: [8, 17]},
      {field: 'tool', op: '!in', value: ['pencil', 'pen']},
    ],
  });

  expect(result.total).toBe(2);
  expect(result.data[0]).toMatchObject({
    name: 'Peter',
    last_name: 'Parker',
    age: 11,
    tool: 'ruler',
  });
  expect(result.data[1]).toMatchObject({
    name: 'Bruce',
    last_name: 'Pedersen',
    age: 13,
    tool: 'crayon',
  });

  const r = result as unknown;
  const {debug} = r as DebugObj;
  expect(debug).toBe(
    "select * from `users` where ((`name` like '%Pe%' or `last_name` like '%Pe%') and `age` between 8 and 17 and `tool` not in ('pencil', 'pen')) order by `age` ASC limit 10"
  );
});

interface DebugObj {
  debug: string;
}
