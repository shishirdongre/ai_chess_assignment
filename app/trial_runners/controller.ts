import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { createObjectCsvWriter } from 'csv-writer';

// Constants
const TRIALS = 5;  // Number of total trials
const THREADS = 8;  // Number of worker threads (1 trial per thread)

// CSV Writer setup
const csvWriter = createObjectCsvWriter({
    path: './chess_trial_results.csv',
    header: [
        { id: 'trial', title: 'Trial' },
        { id: 'winner', title: 'Winner' },
        { id: 'moveCount', title: 'Move Count' },
        { id: 'avgDecisionTime', title: 'Avg Decision Time (ms)' },
    ]
});

// Function to run trials in multiple threads
async function runTrialsInThreads() {
    const results: any[] = [];
    let completedThreads = 0;

    return new Promise((resolve, reject) => {
        for (let i = 1; i <= THREADS; i++) {
            const worker = new Worker('./worker.ts', { workerData: { trialNumber: i } });

            worker.on('message', (result: any) => {
                results.push(result);  // Collect the results from the worker
                completedThreads++;

                // If all threads are completed, resolve the promise
                if (completedThreads === THREADS) {
                    resolve(results);
                }
            });

            worker.on('error', reject);
        }
    });
}

// Run the trials and write to CSV
(async () => {
    try {
        const results = await runTrialsInThreads();

        // Write results to CSV
        await csvWriter.writeRecords(results as never);
        console.log("Results written to chess_trial_results.csv");
    } catch (err) {
        console.error("Error running trials:", err);
    }
})();
