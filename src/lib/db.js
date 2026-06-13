import { openDB } from 'idb'

const DB_NAME = 'job-tracker-db'
const DB_VERSION = 1
const STORE_JOBS = 'jobs'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_JOBS)) {
      db.createObjectStore(STORE_JOBS, { keyPath: 'id' })
    }
  },
})

export async function getAllJobs() {
  return (await dbPromise).getAll(STORE_JOBS)
}

export async function upsertJob(job) {
  return (await dbPromise).put(STORE_JOBS, job)
}

export async function deleteJobById(id) {
  return (await dbPromise).delete(STORE_JOBS, id)
}

export async function clearAllJobs() {
  return (await dbPromise).clear(STORE_JOBS)
}