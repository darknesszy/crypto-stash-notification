import apn from 'apn'
import { map, switchMap, tap } from 'rxjs/operators'
import { fromFetch } from 'rxjs/fetch'
import { from } from 'rxjs'

export const notify$ = (status, msg, url) => fromFetch(`${url}/Users/1`).pipe(
    switchMap(res => res.json()),
    map(user => ({
        deviceToken: user.apn,
        apnProvider: new apn.Provider({
            token: {
                key: process.env['KEY_FILE'],
                keyId: process.env['KEY_ID'],
                teamId: process.env['TEAM_ID']
            },
            production: false
        }),
        note: new apn.Notification({
            expiry: Math.floor(Date.now() / 1000) + 3600, // Expires 1 hour from now.
            badge: 0,
            sound: 'ping.aiff',
            alert: msg,
            topic: process.env['APP_IDENTIFIER'],
            payload: { 'status': status }
        })
    })),
    switchMap(({ deviceToken, apnProvider, note }) => from(apnProvider.send(note, deviceToken))),
    tap(res => console.log(res))
)