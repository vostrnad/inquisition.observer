import 'dotenv/config'

const getEnvironmentValue = (key: string, defaultValue?: string): string => {
  const envVal = process.env[key] || defaultValue

  if (!envVal) {
    throw new Error(`env variable ${key} should be defined`)
  }

  return envVal
}

export const getEnvironmentNumber = (
  key: string,
  defaultValue?: number,
): number => {
  let envVal: number | undefined = Number(process.env[key])
  if (Number.isNaN(envVal)) {
    envVal = defaultValue
  }
  if (typeof envVal === 'undefined') {
    throw new Error(`env variable ${key} should be defined`)
  }
  return envVal
}

export const config = {
  db: {
    name: getEnvironmentValue('DATABASE_URL', 'local.db'),
  },
  bitcoin: {
    rpcAuth: getEnvironmentValue('BITCOIN_RPC_AUTH', 'user:password'),
    rpcHost: getEnvironmentValue('BITCOIN_RPC_HOST', 'http://127.0.0.1:38332'),
    zmqpubhashblock: getEnvironmentValue(
      'BITCOIN_ZMQ_PUB_HASHBLOCK',
      'tcp://127.0.0.1:38334',
    ),
  },
}
