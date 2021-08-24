// 30 minutes
const maximumEpoch = 108000000
const averageRatio = 1.2
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
    'current hashrate is low',
    'reported hashrate is low',
    'report have not updated for at least 30 minutes'
]
export const Status = {
    "HEALTHY": 0,
    "CURRENT_LOW": 1,
    "REPORTED_LOW": 2,
    "OLD_REPORT": 3
}

const checkHashrate = worker => {
    if(worker.hashrates != null && worker.hashrates[0] != null) {
        currentTotal += worker.hashrates[0].current

        if(currentEpoch - new Date(worker.hashrates[0].created).getTime() >= maximumEpoch) {
            return workerExists(Status.OLD_REPORT, worker.id)
        } else if(worker.hashrates[0].current * averageRatio < worker.hashrates[0].average) {
            return workerExists(Status.CURRENT_LOW, worker.id)
        } else if(worker.hashrates[0].reported * averageRatio < worker.hashrates[0].average) {
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