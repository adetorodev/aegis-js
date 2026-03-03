/**
 * Utility for managing concurrent promise execution
 */
export class PromisePool<T> {
  private running = 0;
  private queue: Array<() => void> = [];
  private results: T[] = [];

  constructor(private concurrency: number = 5) {}

  /**
   * Add a task to the pool
   */
  async add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const runTask = () => {
        this.running++;
        task()
          .then((result) => {
            this.results.push(result);
            resolve(result);
          })
          .catch(reject)
          .finally(() => {
            this.running--;
            this.processQueue();
          });
      };

      if (this.running < this.concurrency) {
        runTask();
      } else {
        this.queue.push(runTask);
      }
    });
  }

  /**
   * Wait for all tasks to complete
   */
  async all(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const promises = tasks.map((task) => this.add(task));
    return Promise.all(promises);
  }

  /**
   * Process queued tasks
   */
  private processQueue(): void {
    if (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task();
      }
    }
  }
}

/**
 * Validate a dataset
 */
export function validateDataset(dataset: unknown): boolean {
  if (!dataset || typeof dataset !== 'object') {
    return false;
  }

  const ds = dataset as Record<string, unknown>;

  if (!Array.isArray(ds.cases)) {
    return false;
  }

  for (const caseItem of ds.cases) {
    if (!caseItem || typeof caseItem !== 'object') {
      return false;
    }
    const c = caseItem as Record<string, unknown>;
    if (typeof c.input !== 'string' || typeof c.expectedOutput !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}
