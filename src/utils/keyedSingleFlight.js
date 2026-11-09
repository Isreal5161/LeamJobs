export function createKeyedSingleFlight() {
  const requests = new Map();

  return {
    has(key) {
      return requests.has(key);
    },
    run(key, operation) {
      const currentRequest = requests.get(key);
      if (currentRequest) return currentRequest;

      const request = Promise.resolve()
        .then(operation)
        .finally(() => {
          if (requests.get(key) === request) requests.delete(key);
        });
      requests.set(key, request);
      return request;
    },
  };
}
