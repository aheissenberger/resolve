import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:pubsub-manager')

const createPubsubManager = () => {
  const map = new Map()

  const pubsubManager = {
    connect({ client, connectionId, topics }) {
      if (!map.has(connectionId)) {
        map.set(connectionId, {
          client,
          topics
        })
      }
    },

    disconnect({ connectionId }) {
      if (!map.has(connectionId)) {
        return
      }

      map.delete(connectionId)
    },

    async dispatch({ event }) {
      const promises = []
      const { type, aggregateId } = event

      for (const connectionId of map.keys()) {
        const { topics, client } = map.get(connectionId)
        for (const { topicName, topicId } of topics) {
          if (
            (topicName === type && topicId === aggregateId) ||
            (topicName === '+' && topicId === aggregateId) ||
            (topicName === type && topicId === '+') ||
            (topicName === '+' && topicId === '+')
          ) {
            promises.push(client(JSON.stringify(event)))
          }
        }
      }

      await Promise.all(promises)
    }
  }

  return pubsubManager
}

export default createPubsubManager
