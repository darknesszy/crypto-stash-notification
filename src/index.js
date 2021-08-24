import fetch from 'node-fetch'
import { AbortController } from "node-abort-controller"
import dotenv from 'dotenv'
import { statusUpdate$ } from './polling'
import { notify$ } from './push-notification'
import { switchMap } from 'rxjs/operators'
import { currentTotal, statusMessage } from './evaluation'
import { merge, of } from 'rxjs'

// Setup polyfill for rxjs fromFetch
global.fetch = fetch
global.AbortController = AbortController

// Setup environment variables
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

// 1 hour
const alertEpoch = 3600000
let lastAlert = undefined

const createReport = status => merge(
    ...status.slice(0, 3)
        .map(el => notify$(el.status, `Worker ${el.worker.name}'s ${statusMessage[el.status]}`, process.env['API_SERVER']))
)

statusUpdate$(process.env['API_SERVER'], 60000)
    .pipe(
        switchMap(status => {
            if(currentTotal < Number(process.env['EXPECTED_TOTAL'])) {
                if(lastAlert == undefined) {
                    lastAlert = new Date().getTime()
                    return merge(
                        notify$(4, `Hashrate has dropped to ${(currentTotal / 1000000000).toFixed(3)} GH/s`, process.env['API_SERVER']),
                        createReport(status)
                    )
                } else if(new Date().getTime() - lastAlert > alertEpoch) {
                    return notify$(4, `Hashrate is still abnormal at ${(currentTotal / 1000000000).toFixed(3)} GH/s`, process.env['API_SERVER'])
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