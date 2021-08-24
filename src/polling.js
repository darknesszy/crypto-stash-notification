import { switchMap, tap, map } from 'rxjs/operators'
import { fromFetch } from 'rxjs/fetch'
import { merge, zip, of, interval } from 'rxjs'
import { hashrateStatus } from './evaluation'

export const statusUpdate$ = (url, frequency = 10000) => merge(of(0), interval(frequency))
    .pipe(
        switchMap(() => workers$(url)),
        map(workers => hashrateStatus(workers))
    )

export const workers$ = (url) => fromFetch(`${url}/MiningPools`)
    .pipe(
        switchMap(res => res.json()),
        switchMap(pools => zip(
            pools.map(pool => 
                fromFetch(`${url}/MiningPools/${pool.id}`).pipe(
                    switchMap(res => res.json()),
                    map(({ workers }) => workers)
                )
            )
        )),
        map(workerGroups => workerGroups.reduce((acc, cur) => [...acc, ...cur], [])),
        switchMap(workers => zip(
            workers.map(worker => 
                fromFetch(`${url}/Workers/${worker.id}`).pipe(
                    switchMap(res => res.json()),
                )
            )
        )),
    )