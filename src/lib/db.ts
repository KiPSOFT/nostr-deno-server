import config from '../config/index.ts';
import { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';
import { NostrEvent, NostrFilters } from '../interfaces/messages.ts';
import Logger from './log.ts';

export default class DB {
    public db: any;
    private logger?: Logger;

    async connect(_logger: Logger) {
        const mongoDBUri = `mongodb+srv://${config.mongo.userName}:${config.mongo.password}@${config.mongo.host}/${config.mongo.db}${config.mongo.options}`;
        this.logger = _logger;
        this.logger.debug(`DB Connecting to; ${mongoDBUri} `);
        const client = new MongoClient();
        await client.connect(mongoDBUri);
        this.db = client.database(config.mongo.db);
    }

    async createEvent(event: NostrEvent) {
        return await this.db.collection('events').insertOne(event);
    }

    async getEvents(filters: Array<NostrFilters>) {
        let tmp: Array<any> = [];
        for (const filter of filters) {
            const search = { } as any;
            if (filter.ids) {
                search.id = {
                    $in: filter.ids
                };
            }
            if (filter.authors) {
                search.pubkey = {
                    $in: filter.authors
                };
            }
            if (filter.kinds) {
                search.kind = {
                    $in: filter.kinds
                };
            }
            if (filter['#e']) {
                const tmp = [];
                for (const e of filter['#e']) {
                    tmp.push(['e', e]);
                }
                search.tags = {
                    $in: tmp
                };
            }
            if (filter['#p']) {
                const tmp = [];
                for (const p of filter['#p']) {
                    tmp.push(['p', p]);
                }
                search.tags = {
                    $in: tmp
                };
            }
            if (filter.since) {
                search.created_at = { $gt: filter.since };
            }
            if (filter.until) {
                search.created_at = { $lt: filter.until };
            }
            if (filter.limit) {
                tmp.concat(await this.db.collection('events').find(search).limit(filter.limit));
            } else {
                tmp.concat(await this.db.collection('events').find(search));
            }
        }
        console.log(tmp);
        return tmp;
    }

}