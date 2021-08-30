import { minutesToEpoch } from "./utils"

const gracePeriod = 30 // 30 minutes
let reportedWorkers = []
let currentEpoch = 0
export let currentTotal = 0

export const hashrateStatus = workers => {
    currentEpoch = new Date().getTime()
    currentTotal = 0

    return workers.reduce((acc, cur) => {
        const status = checkHashrate(cur)
        return status == Status.HEALTHY ? acc : [...acc, { worker: cur, status }]
    }, [])
}

export const statusMessage = [
    'healthy',
    'reported hashrate is low',
    'report have not updated for at least 30 minutes'
]
export const Status = {
    "HEALTHY": 0,
    "REPORTED_LOW": 1,
    "OLD_REPORT": 2
}

const checkHashrate = worker => {
    if(worker.hashrates != null && worker.hashrates[0] != null) {
        currentTotal += worker.hashrates[0].current
        const reportTime = new Date(worker.hashrates[0].created)
        reportTime.setHours(reportTime.getHours() + 8)
        
        if(currentEpoch - reportTime.getTime() >= minutesToEpoch(gracePeriod)) {
            return workerExists(Status.OLD_REPORT, worker.id)
        } else if(hashrateLow(worker, 1.3)) {
            return workerExists(Status.REPORTED_LOW, worker.id)
        } else if(reportedWorkers.includes(worker.id)) {
            reportedWorkers.splice(reportedWorkers.indexOf(worker.id))
            return Status.HEALTHY
        }
    }

    return Status.HEALTHY
}

const workerExists = (status, id) => {
    if(!reportedWorkers.includes(id)) {
        reportedWorkers.push(id)
        return status
    }
    return Status.HEALTHY
}

const hashrateLow = (worker, modifier) => {
    return (worker.hashrates[0].reported * modifier < worker.hashrates[0].average)
    && (worker.hashrates[0].current * modifier < worker.hashrates[0].average)
}