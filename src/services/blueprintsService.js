import blueprintsApiClient from './blueprintsApiClient.js'
import apimock from './apimock.js'

const useMock = String(import.meta.env.VITE_USE_MOCK || 'false').toLowerCase() === 'true'

const blueprintsService = useMock ? apimock : blueprintsApiClient

export default blueprintsService