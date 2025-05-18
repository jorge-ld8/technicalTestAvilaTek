import OrderWorker from './OrderWorker';

async function startWorkers() {
  try {
    const orderWorker = new OrderWorker();
    await orderWorker.start();
    console.log('All workers started successfully');
  } catch (error) {
    console.error('Failed to start workers:', error);
    throw error;
  }
}

// Only start workers when this file is executed directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers };
