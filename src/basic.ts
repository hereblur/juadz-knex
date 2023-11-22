import {IDatabaseModel, ResourceAction} from '@juadz/core';
import {Knex} from 'knex';
import {KnexQueryList, KnexQueryListOptions} from './list';
import {IConnectionProvider, PlainObject} from './types';

export function SimpleKnexConnection(
  connectionProvider: IConnectionProvider | Knex,
  options: KnexQueryListOptions,
  tableName: string
): IDatabaseModel {

  const getKnex = (action: ResourceAction): Knex => {
    if (typeof connectionProvider === 'function') {
      return connectionProvider(tableName, action) as Knex;
    }

    return connectionProvider;
  };

  const get = async (id: string | number) => {
    const c = await getKnex('get')
      .select('*')
      .where('id', id)
      .then(t => {
        return t[0];
      });

    return c;
  };

  const update = async (id: string | number, patch: object) => {
    await getKnex('update').where('id', id).update(patch);

    return await get(id);
  };

  const create = async (params_: object) => {
    const params = {
      ...params_,
    };

    const result = await getKnex('create')
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
    await getKnex('replace').raw(
      `REPLACE INTO ${tableName}(${fields.join(', ')})`,
      values
    );

    const insertedData = await get(id);

    return insertedData;
  };

  const delete_ = async (id: string | number) => {
    const result = await getKnex('delete').where('id', id).delete();

    return result;
  };

  const list = KnexQueryList(options, getKnex);

  return {
    get,
    replace,
    update,
    create,
    delete: delete_,
    list,
  } as IDatabaseModel;
};

