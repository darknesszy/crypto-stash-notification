import fetch from 'node-fetch'
import { AbortController } from "node-abort-controller"
import dotenv from 'dotenv'
import { statusUpdate$ } from './polling'
import { notify$ } from './push-notification'
import { switchMap } from 'rxjs/operators'
import { currentTotal, statusMessage } from './evaluation'
import { merge, of } from 'rxjs'
import { hashesToGHash, mHashToHashes, minutesToEpoch } from './utils'

// Setup polyfill for rxjs fromFetch
global.fetch = fetch
global.AbortController = AbortController

// Setup environment variables
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

const gracePeriod = 60 // 1 hour
const expectedTotal = mHashToHashes(Number(process.env['EXPECTED_TOTAL']))
let lastAlert = undefined

const createReport = status => merge(
    ...status.slice(0, 3)
        .map(el => notify$(el.status, `Worker ${el.worker.name}'s ${statusMessage[el.status]}`, process.env['API_SERVER']))
)

statusUpdate$(process.env['API_SERVER'], 60000)
    .pipe(
        switchMap(status => {
            if(currentTotal < expectedTotal) {
                if(lastAlert == undefined) {
                    lastAlert = new Date().getTime()
                    return merge(
                        notify$(4, `Hashrate has dropped to ${hashesToGHash(currentTotal).toFixed(3)} GH/s`, process.env['API_SERVER']),
                        createReport(status)
                    )
                } else if(new Date().getTime() - lastAlert > minutesToEpoch(gracePeriod)) {
                    lastAlert = new Date().getTime()
                    return notify$(4, `Hashrate is still abnormal at ${hashesToGHash(currentTotal).toFixed(3)} GH/s`, process.env['API_SERVER'])
                }
            } else {
                lastAlert = undefined
            }

            if(status.length != 0) {
                return createReport(status)
            }

            return of('Nothing to report')
        })
    )
    .subscribe()