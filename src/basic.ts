import {IDatabaseConnection, DatabaseConnectionGetter} from '@juadz/core';
import {Knex} from 'knex';
import {KnexQueryList, KnexQueryListOptions} from './list';
import {IConnectionProvider, PlainObject} from './types';

export function SimpleKnexConnection(
  connectionProvider: IConnectionProvider | Knex,
  options: KnexQueryListOptions
): DatabaseConnectionGetter {
  return (resourceName: string, action: string) => {
    const getKnex = (action: string): Knex => {
      if (typeof connectionProvider === 'function') {
        return connectionProvider(resourceName, action) as Knex;
      }

      return connectionProvider;
    };

    const get = async (id: string | number) => {
      const c = await getKnex(action)
        .select('*')
        .where('id', id)
        .then(t => {
          return t[0];
        });

      return c;
    };

    const patch = async (id: string | number, patch: object) => {
      await getKnex(action).where('id', id).update(patch);

      return await get(id);
    };

    const create = async (params_: object) => {
      const params = {
        ...params_,
      };

      const result = await getKnex(action)
        .returning('id')
        .insert({
          ...params,
        });

      const insertedId = result[0];
      const insertedData = await get(insertedId);

      return insertedData;
    };

    const replace = async (id: string | number, params_: object) => {
      const params = {
        id,
        ...params_,
      } as PlainObject;

      const fields: Array<string> = [];
      const values: Array<unknown> = [];
      Object.keys(params).forEach(f => {
        fields.push(`\`${f}\`=?`);
        values.push(params[f]);
      });

      // console.log(
      //   `REPLACE INTO ${resourceName}(${fields.join(', ')})`,
      //   values.join(' | ')
      // );
      await getKnex(action).raw(
        `REPLACE INTO ${resourceName}(${fields.join(', ')})`,
        values
      );

      const insertedData = await get(id);

      return insertedData;
    };

    const delete_ = async (id: string | number) => {
      const result = await getKnex(action).where('id', id).delete();

      return result;
    };

    const list = KnexQueryList(options, getKnex);

    return {
      get,
      replace,
      patch,
      create,
      delete: delete_,
      list,
    } as IDatabaseConnection;
  };
}
