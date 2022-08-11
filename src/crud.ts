import {ICrudModel} from '@juadz/core';
import {Knex} from 'knex';
import {KnexQueryList, KnexQueryListOptions, KnexQueryBuilder} from './list';

function getKnex(k: unknown): Knex {
  return k as Knex;
}

export function knexCrud(options: KnexQueryListOptions): ICrudModel {
  const get = async (knex: unknown, id: string | number) => {
    const c = await getKnex(knex)
      .select('*')
      .where(q => {
        if (options.permanentFilter) {
          q.where(options.permanentFilter());
        }
      })
      .where('id', id)
      .then(t => {
        return t[0];
      });

    return c;
  };

  const update = async (knex: unknown, id: string | number, patch: object) => {
    const knex2 = (knex as KnexQueryBuilder).clone();

    const updated = await getKnex(knex)
      .where('id', id)
      .where(q => {
        if (options.permanentFilter) {
          q.where(options.permanentFilter());
        }
      })
      .update(patch);

    return await get(knex2, id);
  };

  const create = async (knex: unknown, params_: object) => {
    const knex2 = (knex as KnexQueryBuilder).clone();
    const params = {
      ...params_,
    };

    const result = await getKnex(knex)
      .returning('id')
      .insert({
        ...params,
      });

    const insertedId = result[0];

    return await get(knex2, insertedId);
  };

  const delete_ = async (knex: unknown, id: string | number) => {
    return await getKnex(knex)
      .where('id', id)
      .where(q => {
        if (options.permanentFilter) {
          q.where(options.permanentFilter());
        }
      })
      .delete();
  };

  const list = KnexQueryList(options);

  return {
    get,
    update,
    create,
    delete: delete_,
    list,
  };
}
